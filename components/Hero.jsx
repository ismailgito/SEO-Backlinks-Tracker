'use client';

import React from 'react';
import { ArrowDown, CheckCircle2, Sparkles } from 'lucide-react';

export default function Hero({ totalSources, dofollowCount, dr90Count, securedCount, onScrollToCatalog }) {
  return (
    <section className="w-full bg-[#F7F7F7] dark:bg-[#0C0D0E] border-b border-[#E0E0E0] dark:border-[#26292E] py-12 md:py-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column (7 cols): Editorial Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top Subtitle */}
            <div className="text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] tracking-widest-editorial uppercase mb-3 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981]" />
              <span>195+ FREE DIRECTORY SUBMISSION SITES (2026)</span>
            </div>

            {/* H1 Massive Display */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight leading-[0.95] mb-5">
              AWESOME FREE <br />
              <span className="text-[#0B6B4F] dark:text-[#10B981]">SEO BACKLINKS</span>
            </h1>

            {/* Bio / Lead text */}
            <p className="text-base sm:text-lg text-[#555555] dark:text-[#9CA3AF] max-w-xl leading-relaxed mb-4">
              Build foundational link equity, boost your Domain Rating (DR), and get indexed by AI search engines. Track your submissions, log live backlinks, and manage multi-project off-page campaigns.
            </p>

            {/* Small horizontal green accent line */}
            <div className="w-16 h-1 bg-[#0B6B4F] dark:bg-[#10B981] mb-6"></div>

            {/* Quick Action buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onScrollToCatalog}
                className="flex items-center space-x-2 bg-[#111111] dark:bg-[#F3F4F6] hover:bg-[#0B6B4F] dark:hover:bg-[#10B981] text-white dark:text-[#111111] dark:hover:text-white px-6 py-3 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
              >
                <span>EXPLORE DIRECTORIES</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <div className="text-xs text-[#888888] dark:text-[#9CA3AF] tracking-wider uppercase flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981]" />
                <span>Zero Spam · 100% Free Submissions</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Impact & Stats Grid + Swiss Quote Box */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Stats Row (3 Columns) */}
            <div className="grid grid-cols-3 gap-3 p-6 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] transition-colors">
              <div className="border-r border-[#E0E0E0] dark:border-[#26292E] pr-3">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
                  {totalSources}+
                </div>
                <div className="text-[11px] font-semibold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mt-1">
                  Sources
                </div>
              </div>

              <div className="border-r border-[#E0E0E0] dark:border-[#26292E] px-3">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B6B4F] dark:text-[#10B981] tracking-tight">
                  {dofollowCount}
                </div>
                <div className="text-[11px] font-semibold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mt-1">
                  Dofollow
                </div>
              </div>

              <div className="pl-3">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
                  {dr90Count}
                </div>
                <div className="text-[11px] font-semibold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mt-1">
                  DR 90+
                </div>
              </div>
            </div>

            {/* Swiss Quote Block */}
            <div className="p-6 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] relative transition-colors">
              <div className="text-5xl font-serif text-[#0B6B4F] dark:text-[#10B981] leading-none mb-1 select-none">
                “
              </div>
              <p className="text-sm italic text-[#333333] dark:text-[#D1D5DB] leading-relaxed mb-4">
                Quality over quantity: A handful of listings on DR 70+ sites with complete profiles beats hundreds of thin submissions to spammy link farms.
              </p>
              <div className="text-[11px] tracking-widest-editorial font-bold text-[#888888] dark:text-[#9CA3AF] uppercase">
                OFF-PAGE STRATEGY · 2026 EDITION
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
