'use client';

import React from 'react';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import { DR_BANDS, FOLLOW_STATUSES, WORKFLOW_STATUSES, STATUS_LABELS } from '@/lib/data/sources';

export default function Filters({
  searchTerm,
  setSearchTerm,
  selectedBand,
  setSelectedBand,
  selectedFollow,
  setSelectedFollow,
  selectedWorkflow,
  setSelectedWorkflow,
  selectedCategory,
  setSelectedCategory,
  categories,
  viewMode,
  setViewMode,
  onResetFilters,
  totalResults,
  totalInventory,
}) {
  const hasActiveFilters =
    searchTerm ||
    selectedBand !== 'All' ||
    selectedFollow !== 'All' ||
    selectedWorkflow !== 'All' ||
    selectedCategory !== 'All';

  return (
    <div className="bg-white dark:bg-[#141619] border-y md:border border-[#E0E0E0] dark:border-[#26292E] p-4 sm:p-6 mb-6 transition-colors duration-200">
      {/* Search Bar & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search directory name, domain, or niche..."
            className="w-full bg-[#F7F7F7] dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-4 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & Reset */}
        <div className="flex items-center space-x-2 justify-end">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 text-xs text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] px-3 py-2 border border-dashed border-[#E0E0E0] dark:border-[#26292E] hover:border-[#111111] dark:hover:border-[#F3F4F6] uppercase tracking-wider font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <div className="flex items-center border border-[#E0E0E0] dark:border-[#26292E] p-0.5 bg-[#F7F7F7] dark:bg-[#1A1D21]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#26292E] text-[#111111] dark:text-[#F3F4F6] shadow-sm'
                  : 'text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#26292E] text-[#111111] dark:text-[#F3F4F6] shadow-sm'
                  : 'text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]'
              }`}
              title="Editorial Card Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Groups */}
      <div className="space-y-4 pt-4 border-t border-[#E0E0E0] dark:border-[#26292E]">
        {/* Row 1: Workflow Status Filter */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-[#888888] dark:text-[#9CA3AF] uppercase tracking-widest-editorial mr-1">
              Workflow:
            </span>
            {WORKFLOW_STATUSES.map((status) => {
              const label = status === 'All' ? 'All' : STATUS_LABELS[status] || status;
              const isActive = selectedWorkflow === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedWorkflow(status)}
                  className={`text-xs px-2.5 py-1 font-medium transition-colors ${
                    isActive
                      ? 'bg-[#111111] dark:bg-[#F3F4F6] text-white dark:text-[#111111]'
                      : 'bg-[#F7F7F7] dark:bg-[#1A1D21] text-[#555555] dark:text-[#9CA3AF] hover:bg-[#EAEAEA] dark:hover:bg-[#22262B] border border-[#E0E0E0] dark:border-[#26292E]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Follow Status & DR Bands */}
        <div className="flex flex-wrap items-center justify-between gap-y-3 pt-3 border-t border-dashed border-[#E0E0E0] dark:border-[#26292E]">
          {/* Follow Status Filter */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-[#888888] dark:text-[#9CA3AF] uppercase tracking-widest-editorial mr-1">
              Follow:
            </span>
            {FOLLOW_STATUSES.map((f) => {
              const isActive = selectedFollow === f;
              const label =
                f === 'All'
                  ? 'All'
                  : f === 'dofollow'
                  ? '✅ Dofollow'
                  : f === 'nofollow'
                  ? '➖ Nofollow'
                  : '⚪ Unverified';
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFollow(f)}
                  className={`text-xs px-2.5 py-1 font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0B6B4F] dark:bg-[#10B981] text-white dark:text-[#0C0D0E] font-bold'
                      : 'bg-[#F7F7F7] dark:bg-[#1A1D21] text-[#555555] dark:text-[#9CA3AF] hover:bg-[#EAEAEA] dark:hover:bg-[#22262B] border border-[#E0E0E0] dark:border-[#26292E]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* DR Band & Category Dropdowns */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-[#888888] dark:text-[#9CA3AF] uppercase tracking-widest-editorial">
                DR Band:
              </span>
              <select
                value={selectedBand}
                onChange={(e) => setSelectedBand(e.target.value)}
                aria-label="Filter by DR Band"
                className="bg-[#F7F7F7] dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] text-xs py-1 px-2.5 text-[#111111] dark:text-[#F3F4F6] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
              >
                {DR_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band === 'All' ? 'All Bands' : `DR ${band}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-[#888888] dark:text-[#9CA3AF] uppercase tracking-widest-editorial">
                Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="bg-[#F7F7F7] dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] text-xs py-1 px-2.5 text-[#111111] dark:text-[#F3F4F6] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981] max-w-[150px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count Line */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] dark:border-[#26292E] flex items-center justify-between text-xs text-[#888888] dark:text-[#9CA3AF]">
        <div>
          Showing <span className="font-bold text-[#111111] dark:text-[#F3F4F6]">{totalResults}</span> of{' '}
          <span className="font-bold text-[#111111] dark:text-[#F3F4F6]">{totalInventory}</span> directories
        </div>
        {hasActiveFilters && (
          <span className="text-[#0B6B4F] dark:text-[#10B981] font-medium">Filtered Active</span>
        )}
      </div>
    </div>
  );
}
