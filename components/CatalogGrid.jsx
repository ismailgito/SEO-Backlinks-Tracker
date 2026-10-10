'use client';

import React from 'react';
import { Edit3, ArrowRight } from 'lucide-react';
import { STATUS_LABELS } from '@/lib/data/sources';
import EmptyCatalog from '@/components/EmptyCatalog';

export default function CatalogGrid({
  sources,
  submissions,
  onOpenSubmissionModal,
  onQuickStatusChange,
}) {
  if (sources.length === 0) {
    return <EmptyCatalog />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sources.map((item, idx) => {
        const submission = submissions[item.id] || { status: 'unsubmitted' };
        const status = submission.status || 'unsubmitted';
        const numberFormatted = String(idx + 1).padStart(2, '0');

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-6 flex flex-col justify-between hover:shadow-sm transition-all relative group"
          >
            {/* Top Card Section: Number + Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#888888] dark:text-[#9CA3AF]">
                  #{numberFormatted}
                </span>

                {/* Follow status pill */}
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                    item.source_follow_status === 'dofollow'
                      ? 'bg-[#E8F3EE] dark:bg-[#10B981]/15 text-[#0B6B4F] dark:text-[#10B981]'
                      : 'bg-[#F0F0F0] dark:bg-[#22262B] text-[#666666] dark:text-[#9CA3AF]'
                  }`}
                >
                  {item.source_follow_status}
                </span>
              </div>

              {/* Title & Green Underline */}
              <h3 className="text-xl font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight group-hover:text-[#0B6B4F] dark:group-hover:text-[#10B981] transition-colors">
                {item.name}
              </h3>
              <div className="w-8 h-0.5 bg-[#0B6B4F] dark:bg-[#10B981] my-2 group-hover:w-16 transition-all"></div>

              {/* Domain & Category */}
              <div className="text-xs text-[#888888] dark:text-[#9CA3AF] font-mono mb-3">
                {item.domain || 'External Directory'}
              </div>

              <div className="flex flex-wrap gap-1 mb-5">
                {(item.categories || []).map((cat, i) => (
                  <span
                    key={i}
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#22262B] text-[#555555] dark:text-[#9CA3AF] font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Middle Section: Authority Metric & Current Status */}
            <div className="border-t border-[#E0E0E0] dark:border-[#26292E] pt-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase">
                    Domain Rating
                  </div>
                  <div className="text-2xl font-black font-mono text-[#111111] dark:text-[#F3F4F6]">
                    {item.dr}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mb-1">
                    Workflow
                  </div>
                  <button
                    onClick={() => onOpenSubmissionModal(item)}
                    className="text-xs font-semibold px-2.5 py-1 border rounded uppercase tracking-wider transition-colors inline-flex items-center space-x-1 bg-white dark:bg-[#1A1D21] border-[#E0E0E0] dark:border-[#26292E] text-[#111111] dark:text-[#F3F4F6]"
                  >
                    <span>{STATUS_LABELS[status] || status}</span>
                    <Edit3 className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>

              {submission.live_url && (
                <div className="mt-2 text-xs truncate text-[#0B6B4F] dark:text-[#10B981] font-mono bg-[#E8F3EE] dark:bg-[#10B981]/15 p-1.5 border border-[#0B6B4F]/20 dark:border-[#10B981]/30">
                  <span className="font-bold">Live:</span> {submission.live_url}
                </div>
              )}
            </div>

            {/* Bottom Card CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E0E0E0] dark:border-[#26292E]">
              {item.submission_url ? (
                <a
                  href={item.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/cta inline-flex items-center space-x-2 text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] hover:text-[#08523C] dark:hover:text-[#34D399] uppercase tracking-wider"
                >
                  <span>SUBMIT DIRECTORY</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover/cta:translate-x-1 transition-transform" />
                </a>
              ) : (
                <span className="text-xs text-[#888888] dark:text-[#6B7280]">Direct submission only</span>
              )}

              <button
                onClick={() => onOpenSubmissionModal(item)}
                className="text-xs text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] font-medium uppercase tracking-wider"
              >
                Log Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
