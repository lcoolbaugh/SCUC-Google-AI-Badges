import React from 'react';
import { Trophy, School, Users, Sparkles, Award, Star } from 'lucide-react';
import { DashboardStats, EarnerProfile } from '../types';
import { triggerCelebration } from '../lib/api';
import scucBadgeSvg from '../assets/images/scuc_google_ai_series_badge.svg';

interface HeroOverviewProps {
  stats: DashboardStats;
  earnerProfiles: EarnerProfile[];
  onSelectEarner?: (profile: EarnerProfile) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  stats,
  earnerProfiles,
  onSelectEarner
}) => {
  // Count multi-badge achievers
  const multiBadgeEarners = earnerProfiles.filter((p) => p.badges.length > 1);
  const tripleCrownEarners = earnerProfiles.filter((p) => {
    const uniqueBadges = new Set(p.badges.map((b) => b.badge));
    return uniqueBadges.size >= 3;
  });

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 border-l-8 border-l-[#4285F4] bg-gradient-to-r from-white via-white to-blue-50/40">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Side: Big Trophy & Total Count */}
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => triggerCelebration()} title="Click to celebrate district achievements!">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex items-center justify-center relative bg-white">
              <img
                src={scucBadgeSvg}
                alt="SCUC Google AI Series Credential"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to static public SVG if needed
                  (e.target as HTMLImageElement).src = '/public/scuc_google_badge.svg';
                }}
              />
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-8 h-8 text-yellow-400 drop-shadow" />
              </div>
            </div>
            <button
              type="button"
              className="absolute -bottom-2 -right-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 p-1.5 rounded-full shadow border-2 border-white transition-transform active:scale-90 cursor-pointer"
              title="Celebrate achievements with confetti"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a73e8]">
                District Total Impact Overview
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 pulse-green"></span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight font-tabular">
                {stats.totalBadges}
              </h2>
              <span className="text-xl sm:text-2xl font-extrabold text-gray-700">
                Total Badges Earned
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Aggregated across all campus faculties and Google Gemini credential programs</span>
              {tripleCrownEarners.length > 0 && (
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {tripleCrownEarners.length} Triple Crown Educator{tripleCrownEarners.length > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Active Campuses */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 border-t-4 border-t-[#EA4335] shadow-xs text-center min-w-[130px]">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-gray-500 mb-1">
              <School className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Campuses</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 font-tabular">
              {stats.activeCampusesCount}
            </h3>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">Participating Units</p>
          </div>

          {/* Verified Earners */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 border-t-4 border-t-[#34A853] shadow-xs text-center min-w-[130px]">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-gray-500 mb-1">
              <Users className="w-3.5 h-3.5 text-[#34A853]" />
              <span>Earners</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 font-tabular">
              {stats.totalEarnersCount}
            </h3>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">Verified Staff</p>
          </div>

          {/* Multi-Badge Achievers */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 border-t-4 border-t-[#FBBC05] shadow-xs text-center min-w-[130px] col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-gray-500 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Multi-Badge</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 font-tabular">
              {multiBadgeEarners.length}
            </h3>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">2+ Credentials</p>
          </div>
        </div>
      </div>
    </section>
  );
};
