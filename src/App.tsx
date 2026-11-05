import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroOverview } from './components/HeroOverview';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { CampusLeaderboard } from './components/CampusLeaderboard';
import { EarnerRosterTable } from './components/EarnerRosterTable';
import { EarnerDetailModal } from './components/EarnerDetailModal';
import { AdminModal } from './components/AdminModal';
import {
  fetchDashboardData,
  triggerCelebration,
  sendCelebrationApi,
  fetchCelebrationsApi
} from './lib/api';
import { DEFAULT_SHEET_CSV_URL } from './lib/constants';
import { ApiResponse, EarnerProfile } from './types';
import { Sparkles, AlertCircle, RefreshCw, Lock } from 'lucide-react';

function mergeCelebrations(
  current: Record<string, number>,
  incoming?: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...current };
  for (const [rawKey, val] of Object.entries(incoming || {})) {
    const k = rawKey.trim();
    merged[k] = Math.max(merged[k] || 0, val || 0);
  }
  return merged;
}

export default function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Celebrations count per earner (everyone starts with 0 cheers)
  const [celebrations, setCelebrations] = useState<Record<string, number>>(() => {
    try {
      localStorage.removeItem('scuc_celebrations'); // Clear any previous demo numbers
      const saved = localStorage.getItem('scuc_celebrations_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Dedicated real-time celebration sync across all users and shared links
  const syncCelebrations = async () => {
    try {
      const serverCelebrations = await fetchCelebrationsApi();
      if (serverCelebrations && Object.keys(serverCelebrations).length > 0) {
        setCelebrations((prev) => {
          const merged = mergeCelebrations(prev, serverCelebrations);
          try {
            localStorage.setItem('scuc_celebrations_v2', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Failed to sync celebrations from server:', err);
    }
  };

  // Settings
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('scuc_sheet_url') || DEFAULT_SHEET_CSV_URL;
  });
  const [pollingInterval, setPollingInterval] = useState<number>(() => {
    const saved = localStorage.getItem('scuc_polling_interval');
    return saved ? parseInt(saved, 10) : 15;
  });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeEarnerProfile, setActiveEarnerProfile] = useState<EarnerProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Previous badges count to trigger confetti when new badge appears
  const prevBadgeCountRef = useRef<number>(0);

  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const response = await fetchDashboardData(sheetUrl, force);
      setData(response);
      setErrorMessage(response.error || null);

      // Merge server celebrations safely using Math.max to prevent rolling back counts
      if (response.celebrations) {
        setCelebrations(prev => {
          const merged = mergeCelebrations(prev, response.celebrations);
          try {
            localStorage.setItem('scuc_celebrations_v2', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

      // If badges increased and not initial load, trigger celebration!
      if (
        prevBadgeCountRef.current > 0 &&
        response.stats.totalBadges > prevBadgeCountRef.current
      ) {
        triggerCelebration();
      }
      prevBadgeCountRef.current = response.stats.totalBadges;
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setErrorMessage('Could not update live data. Displaying cached records.');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  const handleCelebratePerson = (fullName: string, e?: React.MouseEvent) => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) return;

    const originX = e ? e.clientX / window.innerWidth : 0.5;
    const originY = e ? e.clientY / window.innerHeight : 0.6;
    triggerCelebration(originX, originY);

    // Optimistically increment celebration counter immediately
    setCelebrations(prev => {
      const current = prev[trimmed] || 0;
      const next = {
        ...prev,
        [trimmed]: current + 1
      };
      try {
        localStorage.setItem('scuc_celebrations_v2', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Notify backend and merge using Math.max so fast repeated clicks keep adding up
    sendCelebrationApi(trimmed).then(serverCelebrations => {
      if (serverCelebrations) {
        setCelebrations(prev => {
          const next = mergeCelebrations(prev, serverCelebrations);
          try {
            localStorage.setItem('scuc_celebrations_v2', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    });
  };

  // Initial load
  useEffect(() => {
    loadData(false);
    syncCelebrations();
  }, [sheetUrl]);

  // Real-time celebrations polling across shared devices (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      syncCelebrations();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Polling effect for Google Sheets data
  useEffect(() => {
    if (pollingInterval <= 0) return;
    const interval = setInterval(() => {
      loadData(false);
    }, pollingInterval * 1000);
    return () => clearInterval(interval);
  }, [pollingInterval, sheetUrl]);

  // Extracted unique departments for filter dropdown
  const allDepartments = useMemo(() => {
    if (!data?.records) return [];
    return Array.from(new Set(data.records.map((r) => r.department))).filter(Boolean).sort();
  }, [data?.records]);

  const handleSelectEarnerByName = (fullName: string) => {
    if (!data?.earnerProfiles) return;
    const profile = data.earnerProfiles.find((p) => p.fullName === fullName);
    if (profile) {
      setActiveEarnerProfile(profile);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedDepartment('ALL');
    setSearchQuery('');
  };

  const handleSaveSettings = (newUrl: string, newInterval: number) => {
    setSheetUrl(newUrl);
    setPollingInterval(newInterval);
    localStorage.setItem('scuc_sheet_url', newUrl);
    localStorage.setItem('scuc_polling_interval', newInterval.toString());
  };

  const handleResetSettingsDefault = () => {
    setSheetUrl(DEFAULT_SHEET_CSV_URL);
    setPollingInterval(15);
    localStorage.removeItem('scuc_sheet_url');
    localStorage.removeItem('scuc_polling_interval');
  };

  const handleResetCelebrations = async () => {
    setCelebrations({});
    try {
      localStorage.removeItem('scuc_celebrations_v2');
      localStorage.removeItem('scuc_celebrations');
      await fetch('/api/celebrations/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to reset celebrations on server:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] p-3 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header with Branding & Live Sync */}
        <Header
          isLoading={isLoading}
          isLive={data?.isLive ?? true}
          lastUpdated={data?.lastUpdated || ''}
          pollingIntervalSeconds={pollingInterval}
          onRefresh={() => loadData(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Notice banner if non-blocking warning */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer"
            >
              Retry Live Sync
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isInitialLoading && !data ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-gray-200 rounded-2xl w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-72 bg-gray-200 rounded-2xl" />
              <div className="h-72 bg-gray-200 rounded-2xl" />
              <div className="h-72 bg-gray-200 rounded-2xl" />
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl" />
          </div>
        ) : (
          data && (
            <>
              {/* Top Overall Badges Hero Section */}
              <HeroOverview
                stats={data.stats}
                earnerProfiles={data.earnerProfiles}
                onSelectEarner={(profile) => setActiveEarnerProfile(profile)}
              />

              {/* 3 Category Breakdown Section (Top 4 Campuses / Departments Per Category) */}
              <CategoryBreakdown
                stats={data.stats}
                selectedCategory={selectedCategory}
                onSelectCategoryFilter={(catKey) => {
                  setSelectedCategory(catKey);
                  // Smooth scroll to roster table
                  const el = document.getElementById('roster-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Campus / Department Leaderboard */}
              <CampusLeaderboard
                campuses={data.stats.campusLeaderboard}
                selectedCampus={selectedDepartment}
                onSelectCampusFilter={(campusName) => {
                  setSelectedDepartment(campusName);
                  const el = document.getElementById('roster-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Verified Badge Earner Roster Table */}
              <div id="roster-section">
                <EarnerRosterTable
                  records={data.records}
                  allDepartments={allDepartments}
                  selectedCategory={selectedCategory}
                  selectedDepartment={selectedDepartment}
                  searchQuery={searchQuery}
                  celebrations={celebrations}
                  onSelectCategory={setSelectedCategory}
                  onSelectDepartment={setSelectedDepartment}
                  onSearchChange={setSearchQuery}
                  onResetFilters={handleResetFilters}
                  onSelectEarner={handleSelectEarnerByName}
                  onCelebratePerson={handleCelebratePerson}
                />
              </div>
            </>
          )
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-6 pb-4 border-t border-gray-200 mt-8 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-gray-800">SCUC ISD</span>
          <span>·</span>
          <span>Instructional Technology & AI Education Credentials</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Continuous Google Sheets Polling ({pollingInterval}s)</span>
          <span>·</span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hover:underline text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-gray-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </footer>

      {/* Earner Detail Modal */}
      <EarnerDetailModal
        profile={activeEarnerProfile}
        celebrationsCount={activeEarnerProfile ? (celebrations[activeEarnerProfile.fullName] || 0) : 0}
        onClose={() => setActiveEarnerProfile(null)}
        onCelebrate={(e) => {
          if (activeEarnerProfile) {
            handleCelebratePerson(activeEarnerProfile.fullName, e);
          }
        }}
      />

      {/* PIN-Protected Admin Modal */}
      <AdminModal
        currentUrl={sheetUrl}
        pollingIntervalSeconds={pollingInterval}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onResetDefault={handleResetSettingsDefault}
        onResetCelebrations={handleResetCelebrations}
      />
    </div>
  );
}
