'use client';

import React from 'react';
import { ArrowRight, Globe, Shield, Terminal } from 'lucide-react';

export default function Footer({ onScrollToTop, showBackToTop = true }) {
  return (
    <footer className="w-full bg-[#F7F7F7] dark:bg-[#0C0D0E] border-t border-[#E0E0E0] dark:border-[#26292E] mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Left Column (4 cols) */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
              AWESOME FREE SEO BACKLINKS
            </h4>
            <div className="w-10 h-0.5 bg-[#0B6B4F] dark:bg-[#10B981] mb-4"></div>
            <p className="text-xs text-[#666666] dark:text-[#9CA3AF] leading-relaxed mb-4 max-w-sm">
              An open-source inventory of 195+ free directory submission sites, AI tool directories, and startup launch platforms sorted by Domain Rating (DR).
            </p>
            <div className="text-[11px] text-[#888888] dark:text-[#6B7280] font-mono">
              2026 EDITION · ZERO SPAM GUARANTEE
            </div>
          </div>

          {/* Center Column (4 cols) */}
          <div className="md:col-span-4 space-y-3.5 text-xs text-[#555555] dark:text-[#9CA3AF]">
            <div className="flex items-start space-x-3">
              <Globe className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-wider text-[11px]">
                  DATA SOURCE
                </div>
                <div>194 Curated Repositories</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-wider text-[11px]">
                  RULES ENGINE
                </div>
                <div>5 Free Secured Links · Full Audit Trail · UTC Storage</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Terminal className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-wider text-[11px]">
                  DEVELOPER APIS READY
                </div>
                <div>Supabase SSR + Postgres + Resend OTP</div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): CTA Box */}
          <div className="md:col-span-4 flex flex-col justify-between">
            {showBackToTop ? (
              <button
                onClick={onScrollToTop}
                className="group border border-[#111111] dark:border-[#26292E] bg-white dark:bg-[#141619] hover:bg-[#111111] dark:hover:bg-[#10B981] p-5 text-left transition-all"
              >
                <div className="text-xs font-black uppercase tracking-widest-editorial text-[#111111] dark:text-[#F3F4F6] group-hover:text-white dark:group-hover:text-[#0C0D0E] transition-colors mb-2">
                  START BUILDING DOMAIN AUTHORITY TODAY
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] group-hover:text-white dark:group-hover:text-[#0C0D0E] transition-colors">
                  <span>BACK TO TOP</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>
            ) : (
              <div />
            )}

            <div className="text-[11px] text-[#888888] dark:text-[#6B7280] font-mono mt-4">
              Designed with Swiss Minimalist UI Spec
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
