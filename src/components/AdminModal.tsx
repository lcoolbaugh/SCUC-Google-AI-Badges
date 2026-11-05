import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Sheet,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { DEFAULT_SHEET_CSV_URL } from '../lib/constants';

interface AdminModalProps {
  currentUrl: string;
  pollingIntervalSeconds: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, pollingInterval: number) => void;
  onResetDefault: () => void;
  onResetCelebrations?: () => void;
}

const DEFAULT_PIN = '2026';

export const AdminModal: React.FC<AdminModalProps> = ({
  currentUrl,
  pollingIntervalSeconds,
  isOpen,
  onClose,
  onSave,
  onResetDefault,
  onResetCelebrations
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('scuc_admin_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Settings state
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [pollingSec, setPollingSec] = useState(pollingIntervalSeconds);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'source' | 'security' | 'guide'>('source');

  // PIN Change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setUrlInput(currentUrl);
    setPollingSec(pollingIntervalSeconds);
  }, [currentUrl, pollingIntervalSeconds]);

  if (!isOpen) return null;

  const getStoredPin = () => {
    return localStorage.getItem('scuc_admin_pin') || DEFAULT_PIN;
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getStoredPin();

    if (pinInput.trim() === storedPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('scuc_admin_authenticated', 'true');
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Incorrect administrator PIN. Please try again.');
      setPinInput('');
    }
  };

  const handleLockAdmin = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('scuc_admin_authenticated');
    setPinInput('');
    setPinError(null);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Connecting to Google Sheet...');

    try {
      const res = await fetch(`/api/badges?sheetUrl=${encodeURIComponent(urlInput)}&force=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.records && data.records.length > 0) {
          setTestStatus('success');
          setTestMessage(
            `Connection verified! Found ${data.records.length} records across ${data.stats.activeCampusesCount} campus divisions.`
          );
          return;
        }
      }
      throw new Error('No records returned or invalid sheet structure');
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(
        err?.message || 'Failed to connect to Google Sheet. Ensure sheet is set to "Anyone with the link can view".'
      );
    }
  };

  const handleSaveSettings = () => {
    onSave(urlInput.trim(), pollingSec);
    onClose();
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getStoredPin();

    if (currentPinInput !== storedPin) {
      setPinChangeMsg({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (newPinInput.length < 4) {
      setPinChangeMsg({ type: 'error', text: 'New PIN must be at least 4 characters.' });
      return;
    }

    if (newPinInput !== confirmNewPinInput) {
      setPinChangeMsg({ type: 'error', text: 'New PIN and confirmation do not match.' });
      return;
    }

    localStorage.setItem('scuc_admin_pin', newPinInput.trim());
    setPinChangeMsg({ type: 'success', text: 'Admin PIN updated successfully!' });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmNewPinInput('');
  };

  const sheetIdMatch = urlInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetEditUrl = sheetIdMatch
    ? `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/edit`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAuthenticated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {isAuthenticated ? 'SCUC District Admin Dashboard' : 'Protected Administrator Access'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAuthenticated
                  ? 'Authenticated Session · Data Source & Configuration'
                  : 'PIN required to modify district synchronization parameters'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED STATE: PIN Verification Form */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8">
            <div className="text-center max-w-sm mx-auto mb-6">
              <div className="w-16 h-16 bg-blue-50 text-[#1a73e8] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
                <KeyRound className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Enter Admin PIN</h4>
              <p className="text-xs text-gray-500 mt-1">
                Data source configuration is restricted to SCUC ISD Technology coordinators and administrators.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                  District Security PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    autoFocus
                    placeholder="Enter PIN..."
                    className="w-full text-center tracking-widest text-xl font-bold py-3 px-4 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {pinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="w-1/2 py-2.5 text-xs font-bold bg-[#4285F4] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* UNLOCKED STATE: Admin Settings Panel */
          <div>
            {/* Admin Tabs & Lock Button */}
            <div className="bg-gray-100 px-6 py-2.5 border-b border-gray-200 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('source')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'source'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sheet Source</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin PIN</span>
                </button>

                <button
                  onClick={() => setActiveTab('guide')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'guide'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Column Specs</span>
                </button>
              </div>

              <button
                onClick={handleLockAdmin}
                className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="Lock admin session immediately"
              >
                <Lock className="w-3 h-3" />
                <span>Lock</span>
              </button>
            </div>

            {/* TAB 1: Sheet Source Configuration */}
            {activeTab === 'source' && (
              <div className="p-6 space-y-5 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    Connected Google Sheet CSV Export URL:
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setTestStatus('idle');
                    }}
                    className="w-full font-mono text-xs p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Live syncing pulls directly from this sheet. Only district admins with the PIN can view or modify this URL.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || !urlInput}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}</span>
                  </button>

                  {sheetEditUrl && (
                    <a
                      href={sheetEditUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      <span>Open Live Sheet</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setUrlInput(DEFAULT_SHEET_CSV_URL);
                      setTestStatus('idle');
                    }}
                    className="text-gray-500 hover:text-gray-800 text-xs px-2.5 py-2 inline-flex items-center gap-1 font-semibold ml-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset default</span>
                  </button>
                </div>

                {testStatus !== 'idle' && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : testStatus === 'error'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                    {testStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                    {testStatus === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
                    <span>{testMessage}</span>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <label className="block font-bold text-gray-800 mb-1.5">
                    Live Polling Frequency:
                  </label>
                  <div className="flex gap-2">
                    {[10, 15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setPollingSec(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          pollingSec === sec
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {sec} seconds
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Rate at which the dashboard checks for new teacher badge submissions.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Change Security PIN */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Change Administrator PIN</h4>
                  <p className="text-xs text-gray-500">
                    Update the passcode required to access and alter district Google Sheet settings.
                  </p>
                </div>

                <form onSubmit={handleChangePin} className="space-y-3 max-w-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Current PIN:
                    </label>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      required
                      placeholder="Current PIN..."
                      className="w-full text-xs font-mono p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      New PIN (at least 4 characters):
                    </label>
                    <input
                      type="password"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      required
                      placeholder="New PIN..."
                      className="w-full text-xs font-mono p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Confirm New PIN:
                    </label>
                    <input
                      type="password"
                      value={confirmNewPinInput}
                      onChange={(e) => setConfirmNewPinInput(e.target.value)}
                      required
                      placeholder="Confirm new PIN..."
                      className="w-full text-xs font-mono p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {pinChangeMsg && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-bold ${
                        pinChangeMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {pinChangeMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                  >
                    Update PIN
                  </button>
                </form>

                {onResetCelebrations && (
                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="font-bold text-gray-800 text-xs mb-1">Reset All Cheers & Celebrations</h5>
                    <p className="text-[11px] text-gray-500 mb-2">
                      Clear celebration counters for all educators back to zero.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all cheers back to 0 for everyone?')) {
                          onResetCelebrations();
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                    >
                      Reset All Cheers to 0
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Column Specifications Guide */}
            {activeTab === 'guide' && (
              <div className="p-6 space-y-3 text-xs">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Google Form Column Expectations</h4>
                  <p className="text-gray-500">
                    The synchronization parser automatically reads the following standard column columns from your Google Form responses:
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column A (0):</span>
                    <span className="text-gray-500">Timestamp</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column B (1):</span>
                    <span className="text-gray-500">First Name</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column C (2):</span>
                    <span className="text-gray-500">Last Name</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column D (3):</span>
                    <span className="text-gray-500">Please select your Campus/Department</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column E (4):</span>
                    <span className="text-gray-500">Position/Role</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="font-bold text-gray-700">Column F (5):</span>
                    <span className="text-gray-500">Provide the link to your credential/badge site</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-700">Column G (6):</span>
                    <span className="text-gray-500">Which badge have you earned?</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[11px] text-gray-500">
                SCUC ISD IT Security · Protected Session
              </span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                {activeTab === 'source' && (
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2 text-xs font-bold bg-[#4285F4] hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
