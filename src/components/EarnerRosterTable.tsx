import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  User,
  GraduationCap,
  BookMarked,
  Code,
  ShieldCheck,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BadgeRecord, EarnerProfile } from '../types';
import { CAT_CODING, CAT_EDU, CAT_NOTEBOOK, CATEGORY_METADATA } from '../lib/constants';

interface EarnerRosterTableProps {
  records: BadgeRecord[];
  allDepartments: string[];
  selectedCategory: string;
  selectedDepartment: string;
  searchQuery: string;
  celebrations: Record<string, number>;
  onSelectCategory: (cat: string) => void;
  onSelectDepartment: (dept: string) => void;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  onSelectEarner: (profileName: string) => void;
  onCelebratePerson: (fullName: string, e: React.MouseEvent) => void;
}

export const EarnerRosterTable: React.FC<EarnerRosterTableProps> = ({
  records,
  allDepartments,
  selectedCategory,
  selectedDepartment,
  searchQuery,
  celebrations,
  onSelectCategory,
  onSelectDepartment,
  onSearchChange,
  onResetFilters,
  onSelectEarner,
  onCelebratePerson
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      let matchCat = true;
      if (selectedCategory === 'EDU') matchCat = item.badge === CAT_EDU;
      if (selectedCategory === 'NOTEBOOK') matchCat = item.badge === CAT_NOTEBOOK;
      if (selectedCategory === 'CODING') matchCat = item.badge === CAT_CODING;

      const matchDept = selectedDepartment === 'ALL' || item.department === selectedDepartment;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.rawBadge.toLowerCase().includes(q);

      return matchCat && matchDept && matchSearch;
    });
  }, [records, selectedCategory, selectedDepartment, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDepartment, searchQuery, itemsPerPage]);

  // Pagination calculation
  const effectivePageSize = itemsPerPage === -1 ? filteredRecords.length || 1 : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / effectivePageSize));

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedRecords = useMemo(() => {
    if (itemsPerPage === -1) {
      return filteredRecords;
    }
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);
    if (tableTopRef.current) {
      tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Export filtered roster to CSV
  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'First Name',
      'Last Name',
      'Campus/Department',
      'Position/Role',
      'Badge Category',
      'Raw Badge Title',
      'Credential Link'
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.timestamp}"`,
      `"${r.firstName}"`,
      `"${r.lastName}"`,
      `"${r.department}"`,
      `"${r.role}"`,
      `"${r.badge}"`,
      `"${r.rawBadge}"`,
      `"${r.credentialUrl}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scuc-gemini-earners-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeCategoryStyle = (badge: string) => {
    if (badge === CAT_EDU) {
      return {
        bg: 'bg-blue-50',
        text: 'text-[#1a73e8]',
        border: 'border-blue-200',
        icon: GraduationCap
      };
    }
    if (badge === CAT_NOTEBOOK) {
      return {
        bg: 'bg-amber-50',
        text: 'text-[#b06000]',
        border: 'border-amber-200',
        icon: BookMarked
      };
    }
    return {
      bg: 'bg-emerald-50',
      text: 'text-[#188038]',
      border: 'border-emerald-200',
      icon: Code
    };
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 overflow-hidden">
      {/* Title & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-5 gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EA4335] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              Verified Badge Earner Roster
            </h3>
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">
            Real-time synchronized roster of individual credential earners ({filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''})
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Badge Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              onSelectCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs sm:text-sm font-bold py-2 px-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#4285F4] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Badge Categories</option>
            <option value="EDU">Gemini for Education</option>
            <option value="NOTEBOOK">Gemini for Notebook</option>
            <option value="CODING">Vibe Coding with Gemini</option>
          </select>

          {/* Campus / Department Select */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              onSelectDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs sm:text-sm font-bold py-2 px-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#4285F4] focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All Campuses / Departments</option>
            {allDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search earner or role..."
              className="w-full sm:w-56 text-xs sm:text-sm font-medium py-2 pl-9 pr-3 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-[#4285F4] focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* Reset Filters Button */}
          {(selectedCategory !== 'ALL' || selectedDepartment !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                onResetFilters();
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Reset all search and category filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="text-xs sm:text-sm px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl font-bold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download current filtered roster as CSV"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div ref={tableTopRef} className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider font-black text-xs border-b border-gray-300">
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Earner Name</th>
              <th className="p-3.5">Campus / Department</th>
              <th className="p-3.5">Role / Position</th>
              <th className="p-3.5">Badge Category</th>
              <th className="p-3.5 text-center">Credential Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs sm:text-sm font-semibold text-gray-800">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-12 text-gray-400 font-normal">
                  <div className="max-w-md mx-auto">
                    <p className="text-base font-bold text-gray-600 mb-1">No matching earner records found</p>
                    <p className="text-xs text-gray-400">
                      Try clearing or adjusting your category, campus, or search filters.
                    </p>
                    <button
                      onClick={onResetFilters}
                      className="mt-3 text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((row) => {
                const style = getBadgeCategoryStyle(row.badge);
                const BadgeIcon = style.icon;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="p-3.5 text-gray-500 font-mono text-xs whitespace-nowrap font-tabular">
                      {row.timestamp}
                    </td>

                    {/* Earner Name & Celebration Button */}
                    <td className="p-3.5 font-black text-gray-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectEarner(row.fullName)}
                          className="inline-flex items-center gap-2 hover:text-[#1a73e8] transition text-left cursor-pointer group-hover:underline"
                          title="Click to view all credentials earned by this educator"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1a73e8] flex items-center justify-center text-xs font-bold shrink-0">
                            {row.firstName?.[0] || 'E'}
                          </div>
                          <span className="text-sm font-black text-gray-900">{row.fullName}</span>
                        </button>

                        {/* Interactive Celebrate Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCelebratePerson(row.fullName.trim(), e);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all active:scale-90 hover:scale-105 cursor-pointer shadow-2xs select-none ${
                            (celebrations[row.fullName.trim()] || 0) > 0
                              ? 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 border-amber-300'
                              : 'bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-900 border-gray-300 hover:border-amber-300'
                          }`}
                          title={`Celebrate ${row.fullName}! Click multiple times to add cheers`}
                        >
                          <span className="text-xs transition-transform active:rotate-12">🎉</span>
                          <span className="font-tabular font-black text-xs text-amber-950 min-w-[12px] text-center">
                            {celebrations[row.fullName.trim()] || 0}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800">
                            {(celebrations[row.fullName.trim()] || 0) === 1 ? 'cheer' : 'cheers'}
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* Campus / Department */}
                    <td className="p-3.5">
                      <span className="inline-block bg-gray-100 border border-gray-300 text-gray-800 font-extrabold px-2.5 py-1 rounded-lg text-xs">
                        {row.department}
                      </span>
                    </td>

                    {/* Role / Position */}
                    <td className="p-3.5 text-gray-700 font-medium">
                      {row.role}
                    </td>

                    {/* Badge Category */}
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                          title={`Original title: ${row.rawBadge}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{row.badge}</span>
                        </span>
                      </div>
                    </td>

                    {/* Credential Link */}
                    <td className="p-3.5 text-center">
                      {row.credentialUrl && row.credentialUrl !== '#' ? (
                        <a
                          href={row.credentialUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors"
                          title="Verify Google Accredible credential wallet"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verify Credential</span>
                          <ExternalLink className="w-3 h-3 text-emerald-500" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs font-mono">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 py-3.5 mt-4">
        {/* Left: Record summary & Page size selector */}
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <div>
            Showing{' '}
            <span className="font-bold text-gray-900">
              {filteredRecords.length === 0
                ? 0
                : itemsPerPage === -1
                ? 1
                : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-gray-900">
              {itemsPerPage === -1
                ? filteredRecords.length
                : Math.min(currentPage * itemsPerPage, filteredRecords.length)}
            </span>{' '}
            of <span className="font-bold text-gray-900">{filteredRecords.length}</span> verified credentials
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
            <span className="text-gray-500 font-medium">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="text-xs font-bold border border-gray-300 rounded-lg py-1 px-2 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={-1}>Show All ({filteredRecords.length})</option>
            </select>
          </div>
        </div>

        {/* Right: Page navigation buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Direct Page Number Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isCurrent = pageNum === currentPage;
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return (
                      <span key={pageNum} className="text-gray-400 px-1 text-xs select-none">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center font-tabular ${
                      isCurrent
                        ? 'bg-[#1a73e8] text-white shadow-2xs font-black'
                        : 'text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }`}
                    title={`Go to page ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1 transition-colors"
              title="Next Page"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
