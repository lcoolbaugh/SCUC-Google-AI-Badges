import React, { useState } from 'react';
import { Trophy, Flame, ChevronDown, ChevronUp, LayoutGrid, List, Sparkles, Crown, Award, Medal } from 'lucide-react';
import { CampusLeaderboardItem } from '../types';
import { triggerCelebration } from '../lib/api';

interface CampusLeaderboardProps {
  campuses: CampusLeaderboardItem[];
  onSelectCampusFilter: (campusName: string) => void;
  selectedCampus: string;
}

export interface CampusWithRank extends CampusLeaderboardItem {
  rank: number;
  isTied: boolean;
  tiedWithNames: string[];
  rankLabel: string; // e.g. "T-1st", "1st", "T-2nd", "3rd", etc.
  shortRankLabel: string; // e.g. "T-1", "#1", "T-2", etc.
  rankSuffix: string; // "1st", "2nd", "3rd", "4th"
  isLeader: boolean; // rank === 1
  medalType: 'gold' | 'silver' | 'bronze' | 'none';
}

export interface MascotInfo {
  mascot: string;
  emoji: string;
}

// SCUC ISD Campus & Department Mascot Catalog
// NOTE: Cities (Cibolo, Schertz, Universal City) and phrases like "campus wide" or "district wide" are removed per user request.
// A Steele is explicitly LIONS.
const CAMPUS_METADATA: Record<string, MascotInfo> = {
  // A Steele is explicitly LIONS
  'allison l. steele': { mascot: 'Lions', emoji: '🦁' },
  'allison steele': { mascot: 'Lions', emoji: '🦁' },
  'a steele': { mascot: 'Lions', emoji: '🦁' },
  'a. steele': { mascot: 'Lions', emoji: '🦁' },
  'a.steele': { mascot: 'Lions', emoji: '🦁' },

  // Byron P. Steele II High School is KNIGHTS
  'byron p. steele': { mascot: 'Knights', emoji: '⚔️' },
  'byron steele': { mascot: 'Knights', emoji: '⚔️' },
  'b steele': { mascot: 'Knights', emoji: '⚔️' },
  'b. steele': { mascot: 'Knights', emoji: '⚔️' },
  'b.steele': { mascot: 'Knights', emoji: '⚔️' },
  'steele': { mascot: 'Knights', emoji: '⚔️' },

  // Clemens
  'samuel clemens': { mascot: 'Buffaloes', emoji: '🦬' },
  'clemens': { mascot: 'Buffaloes', emoji: '🦬' },

  // Wilder is CHAPARRALS (not a department per user request)
  'wilder': { mascot: 'Chaparrals', emoji: '🪶' },
  'laura ingalls wilder': { mascot: 'Chaparrals', emoji: '🪶' },
  'wilder intermediate': { mascot: 'Chaparrals', emoji: '🪶' },

  // Schertz is PANTHERS (not a department per user request)
  'schertz': { mascot: 'Panthers', emoji: '🐆' },
  'schertz elem': { mascot: 'Panthers', emoji: '🐆' },
  'schertz elementary': { mascot: 'Panthers', emoji: '🐆' },

  // Green Valley is GRIZZLIES (not Gators per user request)
  'green valley': { mascot: 'Grizzlies', emoji: '🐻' },
  'greenvalley': { mascot: 'Grizzlies', emoji: '🐻' },

  // Intermediates & Junior Highs
  'corbett': { mascot: 'Mustangs', emoji: '🐎' },
  'corbet': { mascot: 'Mustangs', emoji: '🐎' },
  'ray corbett': { mascot: 'Mustangs', emoji: '🐎' },
  'ray d corbett': { mascot: 'Mustangs', emoji: '🐎' },
  'ray d. corbett': { mascot: 'Mustangs', emoji: '🐎' },
  'corbett junior': { mascot: 'Mustangs', emoji: '🐎' },
  'corbett junior high': { mascot: 'Mustangs', emoji: '🐎' },
  'corbett jh': { mascot: 'Mustangs', emoji: '🐎' },
  'dobie': { mascot: 'Cougars', emoji: '🐾' },
  'jordan': { mascot: 'Eagles', emoji: '🦅' },
  'barbara jordan': { mascot: 'Eagles', emoji: '🦅' },
  'jordan intermediate': { mascot: 'Eagles', emoji: '🦅' },
  'schlather': { mascot: 'Huskies', emoji: '🐺' },

  // Elementaries
  'sippel': { mascot: 'Stallions', emoji: '🐴' },
  'paschal': { mascot: 'Patriots', emoji: '⭐' },
  'wiederstein': { mascot: 'Wranglers', emoji: '🤠' },
  'rose garden': { mascot: 'Owls', emoji: '🦉' },
  'rosegarden': { mascot: 'Owls', emoji: '🦉' },
  'rose garden elem': { mascot: 'Owls', emoji: '🦉' },
  'rose garden elementary': { mascot: 'Owls', emoji: '🦉' },
  'watts': { mascot: 'Wildcats', emoji: '🐾' },

  // Departments
  'technology': { mascot: 'EdTech', emoji: '💻' },
  'instructional tech': { mascot: 'EdTech', emoji: '💻' },
  'central office': { mascot: 'Administration', emoji: '🏛️' },
  'curriculum': { mascot: 'Curriculum & Instruction', emoji: '📚' },
  'special education': { mascot: 'Special Education', emoji: '🌟' },
  'transportation': { mascot: 'Transportation', emoji: '🚌' },
  'child nutrition': { mascot: 'Child Nutrition', emoji: '🍎' }
};

export function getCampusMascotInfo(name: string): MascotInfo {
  const lower = (name || '').toLowerCase().trim();

  // 1. Priority check for Allison / A Steele to ensure it maps to Lions
  if (
    lower.includes('allison') ||
    lower.includes('a steele') ||
    lower.includes('a. steele') ||
    lower.includes('a.steele') ||
    lower.startsWith('a-steele')
  ) {
    return { mascot: 'Lions', emoji: '🦁' };
  }

  // 2. Priority check for Byron Steele / B Steele to ensure it maps to Knights
  if (
    lower.includes('byron') ||
    lower.includes('b steele') ||
    lower.includes('b. steele') ||
    lower.includes('b.steele') ||
    lower.startsWith('b-steele')
  ) {
    return { mascot: 'Knights', emoji: '⚔️' };
  }

  // 3. Priority check for Wilder -> Chaparrals (not a department per user request)
  if (lower.includes('wilder')) {
    return { mascot: 'Chaparrals', emoji: '🪶' };
  }

  // 4. Priority check for Green Valley -> Grizzlies (not Gators per user request)
  if (lower.includes('green valley') || lower.includes('greenvalley')) {
    return { mascot: 'Grizzlies', emoji: '🐻' };
  }

  // 5. Priority check for Schertz -> Panthers (not a department per user request)
  if (lower.includes('schertz')) {
    return { mascot: 'Panthers', emoji: '🐆' };
  }

  // 6. Priority check for Jordan -> Eagles (not Jaguars per user request)
  if (lower.includes('jordan')) {
    return { mascot: 'Eagles', emoji: '🦅' };
  }

  // 7. Priority check for Corbett -> Mustangs (not Colts per user request)
  if (
    lower.includes('corbett') ||
    lower.includes('corbet') ||
    (lower.includes('ray') && (lower.includes('corbett') || lower.includes('jh') || lower.includes('junior')))
  ) {
    return { mascot: 'Mustangs', emoji: '🐎' };
  }

  // 8. Priority check for Rose Garden -> Owls (per user request)
  if (lower.includes('rose garden') || lower.includes('rosegarden')) {
    return { mascot: 'Owls', emoji: '🦉' };
  }

  for (const [key, meta] of Object.entries(CAMPUS_METADATA)) {
    if (lower.includes(key)) {
      return meta;
    }
  }

  if (lower.includes('high') || lower.includes('hs')) {
    return { mascot: 'High School', emoji: '🎓' };
  }
  if (lower.includes('junior') || lower.includes('middle')) {
    return { mascot: 'Junior High', emoji: '🏫' };
  }
  if (lower.includes('intermediate')) {
    return { mascot: 'Intermediate', emoji: '🏫' };
  }
  if (lower.includes('elem') || lower.includes('primary')) {
    return { mascot: 'Elementary', emoji: '🎒' };
  }
  return { mascot: 'Campus / Division', emoji: '🏫' };
}

function computeRankedCampuses(campuses: CampusLeaderboardItem[]): CampusWithRank[] {
  if (!campuses || campuses.length === 0) return [];

  const result: CampusWithRank[] = [];
  let currentRank = 1;

  for (let i = 0; i < campuses.length; i++) {
    const c = campuses[i];
    const prev = i > 0 ? campuses[i - 1] : null;
    const next = i < campuses.length - 1 ? campuses[i + 1] : null;

    // Tied if badge counts are equal
    const tiedWithPrev = prev ? prev.totalBadges === c.totalBadges : false;
    const tiedWithNext = next ? next.totalBadges === c.totalBadges : false;
    const isTied = tiedWithPrev || tiedWithNext;

    if (!tiedWithPrev) {
      currentRank = i + 1;
    }

    const rankSuffix =
      currentRank === 1
        ? '1st'
        : currentRank === 2
        ? '2nd'
        : currentRank === 3
        ? '3rd'
        : `${currentRank}th`;

    const rankLabel = isTied ? `T-${rankSuffix}` : rankSuffix;
    const shortRankLabel = isTied ? `T-${currentRank}` : `#${currentRank}`;

    let medalType: 'gold' | 'silver' | 'bronze' | 'none' = 'none';
    if (currentRank === 1) medalType = 'gold';
    else if (currentRank === 2) medalType = 'silver';
    else if (currentRank === 3) medalType = 'bronze';

    const tiedWithNames = campuses
      .filter((other) => other.name !== c.name && other.totalBadges === c.totalBadges)
      .map((other) => other.name);

    result.push({
      ...c,
      rank: currentRank,
      isTied,
      tiedWithNames,
      rankLabel,
      shortRankLabel,
      rankSuffix,
      isLeader: currentRank === 1,
      medalType
    });
  }

  return result;
}

export const CampusLeaderboard: React.FC<CampusLeaderboardProps> = ({
  campuses,
  onSelectCampusFilter,
  selectedCampus
}) => {
  const [viewMode, setViewMode] = useState<'podium' | 'table'>('podium');
  const [showAllRanks, setShowAllRanks] = useState(false);

  if (!campuses || campuses.length === 0) {
    return null;
  }

  const rankedCampuses = computeRankedCampuses(campuses);
  const firstPlace = rankedCampuses[0];
  const secondPlace = rankedCampuses[1];
  const thirdPlace = rankedCampuses[2];
  const remainingCampuses = rankedCampuses.slice(3);

  // Check if there is a tie for 1st place
  const isTopLeaderTie = firstPlace?.isTied && firstPlace.rank === 1;

  // Mascot lookups
  const firstMascot = firstPlace ? getCampusMascotInfo(firstPlace.name) : { mascot: '', emoji: '' };
  const secondMascot = secondPlace ? getCampusMascotInfo(secondPlace.name) : { mascot: '', emoji: '' };
  const thirdMascot = thirdPlace ? getCampusMascotInfo(thirdPlace.name) : { mascot: '', emoji: '' };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 relative overflow-hidden">
      {/* Bright Google Spectral Rainbow Accent Bar */}
      <div className="h-1.5 w-[calc(100%+3rem)] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] -mt-6 -mx-6 mb-6" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          {/* Vibrant 4-Color Google Spectral Trophy Badge */}
          <div className="p-[2.5px] rounded-2xl bg-gradient-to-tr from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shadow-md shrink-0">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-[#FBBC05] via-[#fdd663] to-[#f9ab00] text-amber-950 flex items-center justify-center relative">
              <Trophy className="w-6 h-6 text-[#9a5700] fill-[#fff4cc] drop-shadow-2xs" />
              <Sparkles className="w-3 h-3 text-[#EA4335] fill-[#EA4335] absolute top-1.5 right-1.5" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Campus Leaderboard Podium</span>
            </h3>
            <p className="text-xs font-semibold text-gray-500">
              Top performing SCUCISD schools leading the Google AI certification charge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('podium')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'podium'
                  ? 'bg-white text-gray-900 shadow-2xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Show Olympic podium view"
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'podium' ? 'text-[#4285F4]' : ''}`} />
              <span>Podium</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Show full details table view"
            >
              <List className={`w-3.5 h-3.5 ${viewMode === 'table' ? 'text-[#34A853]' : ''}`} />
              <span>Table</span>
            </button>
          </div>

          {/* Live Standings Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 via-yellow-50 to-red-50 border border-[#34A853]/40 text-gray-900 text-xs font-black shadow-2xs">
            <Flame className="w-4 h-4 text-[#EA4335] fill-[#FBBC05] animate-pulse" />
            <span>Live Standings</span>
          </div>
        </div>
      </div>

      {/* PODIUM VIEW */}
      {viewMode === 'podium' ? (
        <div>
          {/* Vibrant Tie Notification Banner if Leaders are Tied */}
          {isTopLeaderTie && (
            <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-50 border-2 border-amber-400 rounded-2xl flex items-center justify-between text-xs font-black text-amber-950 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🤝</span>
                <span>
                  <strong>Even &amp; Tied for 1st Place:</strong> {firstPlace.name} and{' '}
                  {firstPlace.tiedWithNames.join(', ')} are currently tied with {firstPlace.totalBadges} badges each!
                </span>
              </div>
              <span className="text-[11px] bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 px-3 py-1 rounded-full uppercase tracking-wider font-black shadow-2xs border border-amber-300">
                Co-Leaders
              </span>
            </div>
          )}

          {/* 3-Column Bright Google-Palette Podium Grid: 2nd (left), 1st (center, elevated), 3rd (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-end pt-3 pb-2">
            {/* Left Column (2nd Place: Google Blue #4285F4 OR Co-Leader Gold if tied for 1st) */}
            {secondPlace ? (
              <div
                onClick={() => {
                  if (secondPlace.rank === 1) triggerCelebration();
                  onSelectCampusFilter(selectedCampus === secondPlace.name ? 'ALL' : secondPlace.name);
                }}
                className={`order-2 md:order-1 rounded-2xl border-2 transition-all p-6 flex flex-col items-center justify-between text-center min-h-[285px] cursor-pointer hover:shadow-xl relative overflow-hidden ${
                  secondPlace.rank === 1
                    ? selectedCampus === secondPlace.name
                      ? 'bg-gradient-to-b from-[#FBBC05]/25 via-yellow-50/80 to-white border-[#FBBC05] ring-4 ring-yellow-200 shadow-xl'
                      : 'bg-gradient-to-b from-[#FBBC05]/15 via-yellow-50/40 to-white border-[#FBBC05]/70 shadow-md hover:border-[#FBBC05]'
                    : selectedCampus === secondPlace.name
                    ? 'bg-gradient-to-b from-[#4285F4]/20 via-blue-50/70 to-white border-[#4285F4] ring-4 ring-blue-200 shadow-xl'
                    : 'bg-gradient-to-b from-[#4285F4]/12 via-blue-50/40 to-white border-[#4285F4]/45 hover:border-[#4285F4] shadow-md'
                }`}
                title={
                  secondPlace.isTied
                    ? `Even & Tied for ${secondPlace.rankLabel}! Click to filter roster`
                    : 'Click to filter earner roster by this campus'
                }
              >
                {/* Medal Header */}
                <div className="flex flex-col items-center mb-3">
                  {secondPlace.rank === 1 ? (
                    /* Co-Leader Radiant Gold Crown Medal with Google 4-Color Ring */
                    <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shadow-md">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f9ab00] via-[#fdd663] to-[#FBBC05] flex flex-col items-center justify-center border-2 border-white">
                        <Crown className="w-4 h-4 text-[#9a5700] fill-[#fff4cc] -mb-0.5" />
                        <span className="text-xs font-black text-amber-950 font-mono tracking-tight leading-none">
                          {secondPlace.rankLabel}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Bright Google Blue Medal with Blue & Yellow Ribbon */
                    <>
                      <div className="flex gap-1 -mb-1.5 z-0">
                        <div className="w-3.5 h-4 bg-[#4285F4] rounded-t-xs -rotate-12 shadow-2xs" />
                        <div className="w-3.5 h-4 bg-[#FBBC05] rounded-t-xs rotate-12 shadow-2xs" />
                      </div>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1967d2] via-[#4285F4] to-[#669df6] shadow-md shadow-blue-300/60 flex flex-col items-center justify-center border-3 border-white ring-2 ring-[#4285F4]/40 z-10">
                        <Award className="w-4 h-4 text-[#FBBC05] fill-[#FBBC05] -mb-0.5" />
                        <span className="text-xs font-black text-white font-mono tracking-tight leading-none">
                          {secondPlace.rankLabel}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center my-2">
                  {secondPlace.isTied ? (
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider mb-2 px-2.5 py-0.5 rounded-full border shadow-2xs ${
                        secondPlace.rank === 1
                          ? 'text-amber-950 bg-[#FBBC05]/30 border-[#FBBC05]'
                          : 'text-[#1967d2] bg-[#4285F4]/15 border-[#4285F4]/40'
                      }`}
                    >
                      🤝 Even &amp; Tied ({secondPlace.rankLabel})
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1967d2] bg-[#4285F4]/15 border border-[#4285F4]/35 px-2.5 py-0.5 rounded-full mb-2">
                      2nd Place
                    </span>
                  )}

                  <h4 className="text-base lg:text-lg font-black text-gray-900 leading-snug line-clamp-2">
                    {secondPlace.name}
                  </h4>

                  {/* Clean Mascot Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs mt-2 border border-[#4285F4]/30 bg-white text-[#1967d2]">
                    <span className="text-sm">{secondMascot.emoji}</span>
                    <span>{secondMascot.mascot}</span>
                  </div>
                </div>

                {/* Stat Pill */}
                <div
                  className={`mt-4 border font-black text-xs px-4 py-2 rounded-full shadow-md transition-transform hover:scale-105 ${
                    secondPlace.rank === 1
                      ? 'bg-gradient-to-r from-[#FBBC05] to-[#f9ab00] border-amber-300 text-amber-950'
                      : 'bg-gradient-to-r from-[#4285F4] to-[#1a73e8] border-blue-400 text-white'
                  }`}
                >
                  {secondPlace.totalBadges} Badges ({secondPlace.earnersCount} Staff)
                </div>

                {/* Pedestal Base Bar */}
                <div
                  className={`w-24 h-2 rounded-full mx-auto mt-3 shadow-xs ${
                    secondPlace.rank === 1
                      ? 'bg-gradient-to-r from-[#FBBC05] via-[#EA4335] to-[#FBBC05]'
                      : 'bg-gradient-to-r from-[#4285F4] to-[#669df6]'
                  }`}
                />
              </div>
            ) : (
              <div className="order-2 md:order-1" />
            )}

            {/* Center Column: 1st Place (Elevated, Google Yellow #FBBC05 + 4-Color Google Spectral Ring) */}
            {firstPlace && (
              <div
                onClick={() => {
                  triggerCelebration();
                  onSelectCampusFilter(selectedCampus === firstPlace.name ? 'ALL' : firstPlace.name);
                }}
                className={`order-1 md:order-2 rounded-2xl border-3 transition-all p-7 lg:p-8 flex flex-col items-center justify-between text-center min-h-[325px] cursor-pointer hover:shadow-2xl md:-translate-y-3 relative overflow-hidden bg-gradient-to-b from-[#FBBC05]/25 via-yellow-50/70 to-white ${
                  selectedCampus === firstPlace.name
                    ? 'border-[#FBBC05] ring-4 ring-yellow-300 shadow-2xl shadow-amber-300/60'
                    : 'border-[#FBBC05] shadow-xl shadow-amber-200/70 hover:border-[#f9ab00]'
                }`}
                title={
                  firstPlace.isTied
                    ? `Co-District Leader (Tied)! Click to celebrate and filter roster`
                    : 'District Leader! Click to celebrate and filter roster'
                }
              >
                {/* Google 4-Color Spectral Top Ribbon */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] absolute top-0 left-0 right-0" />

                {/* Luminous Glow Ambient Accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FBBC05]/15 via-yellow-100/20 to-transparent rounded-2xl pointer-events-none" />

                {/* Gleaming Golden Crown Medal inside Google 4-Color Halo */}
                <div className="flex flex-col items-center mb-2 relative z-10 mt-1">
                  <div className="p-[3.5px] rounded-full bg-gradient-to-tr from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shadow-lg shadow-amber-300/60">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#f9ab00] via-[#fdd663] to-[#FBBC05] flex flex-col items-center justify-center border-2 border-white">
                      <Crown className="w-5 h-5 text-[#9a5700] fill-[#fff4cc] -mb-0.5 drop-shadow-2xs" />
                      <span className="text-sm font-black text-amber-950 font-mono tracking-tight leading-none">
                        {firstPlace.rankLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center my-2 relative z-10">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 bg-gradient-to-r from-[#FBBC05]/40 via-[#fdd663] to-[#FBBC05]/40 px-3.5 py-0.5 rounded-full border border-[#FBBC05] shadow-2xs mb-2 inline-flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#EA4335] fill-[#FBBC05]" />
                    <span>{firstPlace.isTied ? 'CO-DISTRICT LEADER (TIED)' : 'DISTRICT LEADER'}</span>
                  </span>

                  {firstPlace.isTied && (
                    <span className="mb-2 text-[10px] bg-amber-100 text-amber-950 border border-[#FBBC05] px-2.5 py-0.5 rounded-full font-black uppercase inline-flex items-center gap-1 shadow-2xs">
                      🤝 Even &amp; Tied for 1st
                    </span>
                  )}

                  <h4 className="text-lg lg:text-xl font-black text-gray-900 leading-snug line-clamp-2">
                    {firstPlace.name}
                  </h4>

                  {/* Clean Mascot Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs mt-2 border border-[#FBBC05] bg-white text-amber-950">
                    <span className="text-sm">{firstMascot.emoji}</span>
                    <span>{firstMascot.mascot}</span>
                  </div>
                </div>

                {/* 1st Place Bright Google Yellow Stat Pill */}
                <div className="mt-4 bg-gradient-to-r from-[#FBBC05] via-[#fdd663] to-[#f9ab00] hover:from-[#fdd663] hover:to-[#FBBC05] text-amber-950 font-black text-xs lg:text-sm px-5 py-2 rounded-full shadow-md shadow-amber-200 border border-[#f9ab00] relative z-10 flex items-center gap-1.5 transition-transform hover:scale-105">
                  <Sparkles className="w-4 h-4 text-[#EA4335] fill-[#EA4335]" />
                  <span>
                    {firstPlace.totalBadges} Badges ({firstPlace.earnersCount} Staff)
                  </span>
                </div>

                {/* Google 4-Color Pedestal Base Bar */}
                <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] mx-auto mt-3 shadow-xs relative z-10" />
              </div>
            )}

            {/* Right Column: 3rd Place (Google Green #34A853 with Red/Yellow accents) */}
            {thirdPlace ? (
              <div
                onClick={() => onSelectCampusFilter(selectedCampus === thirdPlace.name ? 'ALL' : thirdPlace.name)}
                className={`order-3 rounded-2xl border-2 transition-all p-6 flex flex-col items-center justify-between text-center min-h-[285px] cursor-pointer hover:shadow-xl ${
                  selectedCampus === thirdPlace.name
                    ? 'bg-gradient-to-b from-[#34A853]/20 via-emerald-50/70 to-white border-[#34A853] ring-4 ring-emerald-200 shadow-xl'
                    : 'bg-gradient-to-b from-[#34A853]/12 via-emerald-50/40 to-white border-[#34A853]/45 hover:border-[#34A853] shadow-md'
                }`}
                title={
                  thirdPlace.isTied
                    ? `Even & Tied for ${thirdPlace.rankLabel}! Click to filter roster`
                    : 'Click to filter earner roster by this campus'
                }
              >
                {/* Google Green Medal with Red & Yellow Ribbons */}
                <div className="flex flex-col items-center mb-3">
                  <div className="flex gap-1 -mb-1.5 z-0">
                    <div className="w-3.5 h-4 bg-[#EA4335] rounded-t-xs -rotate-12 shadow-2xs" />
                    <div className="w-3.5 h-4 bg-[#FBBC05] rounded-t-xs rotate-12 shadow-2xs" />
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#188038] via-[#34A853] to-[#5bb974] shadow-md shadow-emerald-300/60 flex flex-col items-center justify-center border-3 border-white ring-2 ring-[#34A853]/40 z-10">
                    <Medal className="w-4 h-4 text-[#FBBC05] fill-[#FBBC05] -mb-0.5" />
                    <span className="text-xs font-black text-white font-mono tracking-tight leading-none">
                      {thirdPlace.rankLabel}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center my-2">
                  {thirdPlace.isTied ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#188038] bg-[#34A853]/15 border border-[#34A853]/40 px-2.5 py-0.5 rounded-full mb-2 shadow-2xs">
                      🤝 Even &amp; Tied ({thirdPlace.rankLabel})
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#188038] bg-[#34A853]/15 border border-[#34A853]/35 px-2.5 py-0.5 rounded-full mb-2">
                      3rd Place
                    </span>
                  )}

                  <h4 className="text-base lg:text-lg font-black text-gray-900 leading-snug line-clamp-2">
                    {thirdPlace.name}
                  </h4>

                  {/* Clean Mascot Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs mt-2 border border-[#34A853]/30 bg-white text-[#188038]">
                    <span className="text-sm">{thirdMascot.emoji}</span>
                    <span>{thirdMascot.mascot}</span>
                  </div>
                </div>

                {/* Stat Pill */}
                <div className="mt-4 bg-gradient-to-r from-[#34A853] to-[#188038] border border-emerald-400 text-white font-black text-xs px-4 py-2 rounded-full shadow-md shadow-emerald-200 transition-transform hover:scale-105">
                  {thirdPlace.totalBadges} Badges ({thirdPlace.earnersCount} Staff)
                </div>

                {/* Pedestal Base Bar */}
                <div className="w-20 h-2 rounded-full bg-gradient-to-r from-[#34A853] to-[#5bb974] mx-auto mt-3 shadow-xs" />
              </div>
            ) : (
              <div className="order-3" />
            )}
          </div>

          {/* Remaining Campuses Accordion */}
          {remainingCampuses.length > 0 && (
            <div className="mt-7 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAllRanks(!showAllRanks)}
                  className="inline-flex items-center gap-2 text-xs font-black text-gray-800 hover:text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-4 py-2.5 rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
                >
                  <span>
                    {showAllRanks
                      ? 'Hide Remaining District Standings'
                      : `View Remaining District Standings (${remainingCampuses[0]?.shortRankLabel} to #${campuses.length})`}
                  </span>
                  {showAllRanks ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </button>

                {selectedCampus !== 'ALL' && (
                  <button
                    onClick={() => onSelectCampusFilter('ALL')}
                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Clear Filter ({selectedCampus})
                  </button>
                )}
              </div>

              {showAllRanks && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4 animate-in fade-in duration-150">
                  {remainingCampuses.map((c, index) => {
                    const isSelected = selectedCampus === c.name;
                    const mascot = getCampusMascotInfo(c.name);

                    // Cycle strictly through the 4 Google brand colors
                    const colorSchemes = [
                      {
                        rankBg: 'bg-[#4285F4] text-white border-[#1967d2]',
                        cardBorder: 'border-l-4 border-l-[#4285F4]',
                        badgeBg: 'text-[#1967d2] bg-blue-50 border-blue-200'
                      },
                      {
                        rankBg: 'bg-[#EA4335] text-white border-[#c5221f]',
                        cardBorder: 'border-l-4 border-l-[#EA4335]',
                        badgeBg: 'text-[#c5221f] bg-red-50 border-red-200'
                      },
                      {
                        rankBg: 'bg-[#FBBC05] text-amber-950 border-[#f29900]',
                        cardBorder: 'border-l-4 border-l-[#FBBC05]',
                        badgeBg: 'text-amber-900 bg-amber-50 border-amber-200'
                      },
                      {
                        rankBg: 'bg-[#34A853] text-white border-[#188038]',
                        cardBorder: 'border-l-4 border-l-[#34A853]',
                        badgeBg: 'text-[#188038] bg-emerald-50 border-emerald-200'
                      }
                    ];
                    const scheme = colorSchemes[index % colorSchemes.length];

                    return (
                      <div
                        key={c.name}
                        onClick={() => onSelectCampusFilter(isSelected ? 'ALL' : c.name)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${scheme.cardBorder} ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
                            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 font-mono border shadow-2xs ${scheme.rankBg}`}
                          >
                            {c.shortRankLabel}
                          </span>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <h5 className="text-xs font-black text-gray-900 truncate">{c.name}</h5>
                              {c.isTied && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black uppercase border border-amber-300 shrink-0">
                                  Tied
                                </span>
                              )}
                            </div>
                            {/* Clean Mascot with NO cities or campus-wide strings */}
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 mt-0.5">
                              <span>{mascot.emoji}</span>
                              <span>{mascot.mascot}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shadow-2xs ${scheme.badgeBg}`}>
                            {c.totalBadges} badges
                          </span>
                          <span className="block text-[10px] text-gray-500 font-bold mt-1">
                            {c.earnersCount} staff
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW WITH VIBRANT COLORS & CLEAN MASCOTS */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-[11px] font-black tracking-wider border-b border-gray-300">
                <th className="p-3.5 w-20 text-center">Rank</th>
                <th className="p-3.5">Campus / Department</th>
                <th className="p-3.5">Mascot / Division</th>
                <th className="p-3.5 text-center">Total Badges</th>
                <th className="p-3.5 text-center">Active Earners</th>
                <th className="p-3.5">Category Distribution</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-800">
              {rankedCampuses.map((campus) => {
                const isSelected = selectedCampus === campus.name;
                const mascot = getCampusMascotInfo(campus.name);
                const total = Math.max(1, campus.totalBadges);
                const eduPct = Math.round((campus.eduCount / total) * 100);
                const notebookPct = Math.round((campus.notebookCount / total) * 100);
                const codingPct = Math.round((campus.codingCount / total) * 100);
                const citizensPct = Math.round(((campus.citizensCount || 0) / total) * 100);
                const materialsPct = Math.round(((campus.materialsCount || 0) / total) * 100);
                const adaptPct = Math.round(((campus.adaptCount || 0) / total) * 100);

                return (
                  <tr
                    key={campus.name}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-l-[#4285F4]' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span
                          className={`inline-flex items-center justify-center min-w-[32px] h-7 px-1.5 rounded-full text-xs font-black font-mono shadow-2xs ${
                            campus.rank === 1
                              ? 'bg-amber-100 text-amber-950 border border-amber-400'
                              : campus.rank === 2
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : campus.rank === 3
                              ? 'bg-orange-100 text-orange-950 border border-orange-300'
                              : campus.isTied
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {campus.shortRankLabel}
                        </span>
                        {campus.isTied && (
                          <span className="text-[9px] font-black text-amber-900 uppercase tracking-tight bg-amber-100 border border-amber-300 px-1 rounded-sm leading-tight">
                            Tied
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-black text-gray-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{campus.name}</span>
                        {campus.isTied && (
                          <span className="text-[10px] bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-full font-black inline-flex items-center gap-1">
                            🤝 Tied ({campus.totalBadges} badges, {campus.earnersCount} staff)
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            Filtered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {/* Clean Mascot with NO cities or campus-wide strings */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-gray-100 border border-gray-200 text-gray-800">
                        <span>{mascot.emoji}</span>
                        <span>{mascot.mascot}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-block bg-blue-50 text-[#1a73e8] border border-blue-200 px-2.5 py-1 rounded-lg font-black font-tabular text-sm shadow-2xs">
                        {campus.totalBadges}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-tabular text-gray-700">
                      <span className="inline-flex items-center gap-1 font-black">
                        {campus.earnersCount}
                      </span>
                    </td>
                    <td className="p-3.5 min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex">
                          {campus.eduCount > 0 && (
                            <div
                              style={{ width: `${eduPct}%` }}
                              className="bg-[#4285F4] h-full"
                              title={`Education: ${campus.eduCount}`}
                            />
                          )}
                          {campus.notebookCount > 0 && (
                            <div
                              style={{ width: `${notebookPct}%` }}
                              className="bg-[#FBBC05] h-full"
                              title={`Notebook: ${campus.notebookCount}`}
                            />
                          )}
                          {campus.codingCount > 0 && (
                            <div
                              style={{ width: `${codingPct}%` }}
                              className="bg-[#34A853] h-full"
                              title={`Vibe Coding: ${campus.codingCount}`}
                            />
                          )}
                          {(campus.citizensCount || 0) > 0 && (
                            <div
                              style={{ width: `${citizensPct}%` }}
                              className="bg-[#EA4335] h-full"
                              title={`Empowering Digital Citizens: ${campus.citizensCount}`}
                            />
                          )}
                          {(campus.materialsCount || 0) > 0 && (
                            <div
                              style={{ width: `${materialsPct}%` }}
                              className="bg-[#1967D2] h-full"
                              title={`Classroom-Ready Instructional Materials: ${campus.materialsCount}`}
                            />
                          )}
                          {(campus.adaptCount || 0) > 0 && (
                            <div
                              style={{ width: `${adaptPct}%` }}
                              className="bg-[#E37400] h-full"
                              title={`Adapt (Level) Materials: ${campus.adaptCount}`}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono shrink-0 font-bold">
                          <span className="text-[#4285F4]" title="Education badges">{campus.eduCount}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-[#b06000]" title="Notebook badges">{campus.notebookCount}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-[#188038]" title="Vibe Coding badges">{campus.codingCount}</span>
                          {((campus.citizensCount || 0) > 0 ||
                            (campus.materialsCount || 0) > 0 ||
                            (campus.adaptCount || 0) > 0) && (
                            <>
                              <span className="text-gray-300">/</span>
                              <span className="text-[#d93025]" title="Empowering Digital Citizens badges">
                                {campus.citizensCount || 0}
                              </span>
                              <span className="text-gray-300">/</span>
                              <span className="text-[#1967d2]" title="Classroom-Ready Materials badges">
                                {campus.materialsCount || 0}
                              </span>
                              <span className="text-gray-300">/</span>
                              <span className="text-[#c26401]" title="Adapt (Level) Materials badges">
                                {campus.adaptCount || 0}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onSelectCampusFilter(isSelected ? 'ALL' : campus.name)}
                        className="text-xs font-bold text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {isSelected ? 'Clear Filter' : 'Filter Roster'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
