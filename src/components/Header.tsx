import React from 'react';
import { RefreshCw, Lock } from 'lucide-react';

interface HeaderProps {
  isLoading: boolean;
  isLive: boolean;
  lastUpdated: string;
  pollingIntervalSeconds: number;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenSubmissionForm?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoading,
  isLive,
  lastUpdated,
  pollingIntervalSeconds,
  onRefresh,
  onOpenSettings
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <header className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6 border-t-8 border-t-[#4285F4]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">e</span>
              <span className="text-[#FBBC05]">m</span>
              <span className="text-[#4285F4]">i</span>
              <span className="text-[#34A853]">n</span>
              <span className="text-[#EA4335]">i</span>
            </span>
          </div>

          <div className="h-10 w-px bg-gray-200"></div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 tracking-tight">
                SCUC GEMINI BADGES DASHBOARD
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span>Real-Time Google Sheets Integration</span>
              <span>·</span>
              <span>Schertz-Cibolo-Universal City ISD</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Polling Status Pill */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-green"></span>
            <span className="font-mono">Sync Active ({pollingIntervalSeconds}s)</span>
            <span className="text-emerald-400">·</span>
            <span className="text-emerald-700 font-normal text-[11px] font-mono">{formattedTime}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-[#4285F4] hover:bg-[#3367D6] active:scale-95 disabled:opacity-70 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
            title="Force refresh data directly from Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Update Data Now'}</span>
          </button>

          {/* Admin Protected Settings */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="District Administrator Settings (PIN Protected)"
          >
            <Lock className="w-3.5 h-3.5 text-gray-500" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
