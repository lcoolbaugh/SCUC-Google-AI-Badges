import React from 'react';
import { GraduationCap, BookMarked, Code, ExternalLink, Filter, Layers } from 'lucide-react';
import { DashboardStats } from '../types';
import { CAT_CODING, CAT_EDU, CAT_NOTEBOOK, CATEGORY_METADATA } from '../lib/constants';

interface CategoryBreakdownProps {
  stats: DashboardStats;
  selectedCategory: string;
  onSelectCategoryFilter: (categoryKey: string) => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  stats,
  selectedCategory,
  onSelectCategoryFilter
}) => {
  const categories = [
    {
      key: 'EDU',
      fullName: CAT_EDU,
      meta: CATEGORY_METADATA[CAT_EDU],
      info: stats.categories.edu,
      icon: GraduationCap,
      accentBorder: 'border-t-[#4285F4]',
      badgeColorClass: 'bg-[#4285F4]',
      barColorClass: 'bg-[#4285F4]',
      iconBg: 'bg-blue-100 text-[#1a73e8]',
      counterText: 'text-[#1a73e8]'
    },
    {
      key: 'NOTEBOOK',
      fullName: CAT_NOTEBOOK,
      meta: CATEGORY_METADATA[CAT_NOTEBOOK],
      info: stats.categories.notebook,
      icon: BookMarked,
      accentBorder: 'border-t-[#FBBC05]',
      badgeColorClass: 'bg-[#f29900]',
      barColorClass: 'bg-[#FBBC05]',
      iconBg: 'bg-amber-100 text-[#b06000]',
      counterText: 'text-[#b06000]'
    },
    {
      key: 'CODING',
      fullName: CAT_CODING,
      meta: CATEGORY_METADATA[CAT_CODING],
      info: stats.categories.coding,
      icon: Code,
      accentBorder: 'border-t-[#34A853]',
      badgeColorClass: 'bg-[#34A853]',
      barColorClass: 'bg-[#34A853]',
      iconBg: 'bg-emerald-100 text-[#188038]',
      counterText: 'text-[#188038]'
    }
  ];

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1a73e8] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Badge Category Breakdown
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              Top 4 Participating Campuses / Departments Per Category
            </p>
          </div>
        </div>

        {selectedCategory !== 'ALL' && (
          <button
            onClick={() => onSelectCategoryFilter('ALL')}
            className="text-xs font-bold text-[#1a73e8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Showing filtered category: {selectedCategory}</span>
            <span className="font-bold underline ml-1">Clear</span>
          </button>
        )}
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const topList = cat.info?.top4 || [];
          const maxCount = topList.length > 0 ? topList[0].count : 1;
          const isCurrentFilter = selectedCategory === cat.key;

          return (
            <div
              key={cat.key}
              className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between border-t-4 ${cat.accentBorder} transition-all ${
                isCurrentFilter ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
              }`}
            >
              <div>
                {/* Header with Title & Large Badge Counter */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${cat.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                        {cat.meta.shortName}
                      </h3>
                      <p className="text-xs font-semibold text-gray-500 font-mono">
                        {cat.meta.level}
                      </p>
                    </div>
                  </div>

                  <div className={`${cat.meta.bgSoft} border ${cat.meta.borderSoft} px-3.5 py-1.5 rounded-2xl text-center min-w-[70px]`}>
                    <span className={`text-2xl sm:text-3xl font-black ${cat.counterText} block leading-tight font-tabular`}>
                      {cat.info?.count || 0}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${cat.meta.tagText}`}>
                      Badges
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {cat.meta.description}
                </p>

                {/* Top 4 Departments List */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                      Top 4 Campuses / Departments
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">Rank & Share</span>
                  </div>

                  {topList.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400 italic">
                      No submissions recorded in this category yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(() => {
                        let currentRank = 1;
                        return topList.map((dept, idx) => {
                          const prev = idx > 0 ? topList[idx - 1] : null;
                          const next = idx < topList.length - 1 ? topList[idx + 1] : null;
                          const isTied =
                            (prev && prev.count === dept.count) ||
                            (next && next.count === dept.count);
                          if (prev && prev.count !== dept.count) {
                            currentRank = idx + 1;
                          }
                          const rankText = isTied ? `T-#${currentRank}` : `#${currentRank}`;
                          const pct = Math.max(10, Math.round((dept.count / maxCount) * 100));

                          return (
                            <div
                              key={dept.name}
                              className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70 hover:bg-gray-100/60 transition-colors"
                            >
                              <div className="flex justify-between items-center text-xs sm:text-sm font-extrabold mb-1.5">
                                <span className="text-gray-900 truncate max-w-[210px] flex items-center gap-1.5" title={dept.name}>
                                  <span className={`font-black mr-0.5 font-mono ${isTied ? 'text-amber-800' : 'text-gray-400'}`}>
                                    {rankText}
                                  </span>
                                  <span className="truncate">{dept.name}</span>
                                  {isTied && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-black uppercase tracking-tight shrink-0">
                                      Tied
                                    </span>
                                  )}
                                </span>
                                <span className={`font-black ${cat.badgeColorClass} text-white px-2.5 py-0.5 rounded-full text-xs font-tabular`}>
                                  {dept.count} badge{dept.count !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Relative Progress Bar */}
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${cat.barColorClass} transition-all duration-500 rounded-full`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectCategoryFilter(isCurrentFilter ? 'ALL' : cat.key)}
                  className={`text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    isCurrentFilter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{isCurrentFilter ? 'Active Filter' : 'Filter Roster'}</span>
                </button>

                <a
                  href={cat.meta.officialCourseUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-semibold text-gray-700 hover:text-blue-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 transition"
                  title="Open Google AI Educator Series Badges overview"
                >
                  <span>Course info</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
