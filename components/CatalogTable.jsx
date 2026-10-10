'use client';

import React from 'react';
import { ExternalLink, Edit3 } from 'lucide-react';
import EmptyCatalog from '@/components/EmptyCatalog';

export default function CatalogTable({
  sources,
  submissions,
  onOpenSubmissionModal,
  onQuickStatusChange,
}) {
  if (sources.length === 0) {
    return <EmptyCatalog />;
  }

  return (
    <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] overflow-x-auto transition-colors duration-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E0E0E0] dark:border-[#26292E] bg-[#FAFAFA] dark:bg-[#1A1D21] text-[11px] font-bold text-[#888888] dark:text-[#9CA3AF] tracking-widest-editorial uppercase">
            <th className="py-3 px-4 sm:px-6">Source / Domain</th>
            <th className="py-3 px-4 w-20 text-center">DR</th>
            <th className="py-3 px-4 hidden md:table-cell">Categories</th>
            <th className="py-3 px-4">Follow</th>
            <th className="py-3 px-4">Workflow Status</th>
            <th className="py-3 px-4 text-center">Direct Link</th>
            <th className="py-3 px-4 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E0E0E0] dark:divide-[#26292E] text-sm text-[#111111] dark:text-[#F3F4F6]">
          {sources.map((item) => {
            const submission = submissions[item.id] || { status: 'unsubmitted' };
            const status = submission.status || 'unsubmitted';

            return (
              <tr
                key={item.id}
                className="hover:bg-[#F9F9F9] dark:hover:bg-[#1C1F24] transition-colors group"
              >
                {/* Source Name & Domain */}
                <td className="py-3.5 px-4 sm:px-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#111111] dark:text-[#F3F4F6] group-hover:text-[#0B6B4F] dark:group-hover:text-[#10B981] transition-colors">
                      {item.name}
                    </span>
                    {item.domain && (
                      <span className="text-xs text-[#888888] dark:text-[#9CA3AF] font-mono mt-0.5">
                        {item.domain}
                      </span>
                    )}
                  </div>
                </td>

                {/* Domain Rating */}
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block font-mono font-bold text-xs px-2 py-0.5 border ${
                      item.dr >= 90
                        ? 'border-[#0B6B4F] dark:border-[#10B981] text-[#0B6B4F] dark:text-[#10B981] bg-[#E8F3EE] dark:bg-[#10B981]/15'
                        : item.dr >= 70
                        ? 'border-[#111111] dark:border-[#D1D5DB] text-[#111111] dark:text-[#F3F4F6] bg-white dark:bg-[#1A1D21]'
                        : 'border-[#E0E0E0] dark:border-[#26292E] text-[#666666] dark:text-[#9CA3AF] bg-[#F7F7F7] dark:bg-[#1A1D21]'
                    }`}
                  >
                    {item.dr}
                  </span>
                </td>

                {/* Categories */}
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(item.categories || []).map((cat, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0F0] dark:bg-[#22262B] text-[#555555] dark:text-[#9CA3AF] font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Follow Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {item.source_follow_status === 'dofollow' ? (
                    <span className="inline-flex items-center text-xs font-semibold text-[#0B6B4F] dark:text-[#10B981]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] dark:bg-[#10B981] mr-1.5"></span>
                      Dofollow
                    </span>
                  ) : item.source_follow_status === 'nofollow' ? (
                    <span className="inline-flex items-center text-xs text-[#666666] dark:text-[#9CA3AF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#999999] dark:bg-[#6B7280] mr-1.5"></span>
                      Nofollow
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-[#888888] dark:text-[#6B7280]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CCCCCC] dark:bg-[#4B5563] mr-1.5"></span>
                      Unverified
                    </span>
                  )}
                </td>

                {/* Workflow Status Dropdown / Pill */}
                <td className="py-3.5 px-4">
                  <div className="relative inline-block">
                    <select
                      value={status}
                      onChange={(e) => onQuickStatusChange(item, e.target.value)}
                      aria-label="Change workflow status"
                      className="text-xs font-semibold uppercase tracking-wider py-1 pl-2.5 pr-6 border rounded cursor-pointer transition-colors appearance-none bg-white dark:bg-[#1A1D21] border-[#E0E0E0] dark:border-[#26292E] text-[#111111] dark:text-[#F3F4F6]"
                    >
                      <option value="unsubmitted">Unsubmitted</option>
                      <option value="on_progress">On Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="secured">Secured ★</option>
                      <option value="rejected">Rejected</option>
                      <option value="unable">Unable</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#888888] dark:text-[#9CA3AF]">
                      ▼
                    </span>
                  </div>
                </td>

                {/* Submission Link */}
                <td className="py-3.5 px-4 text-center">
                  {item.submission_url ? (
                    <a
                      href={item.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] hover:text-[#08523C] dark:hover:text-[#34D399] uppercase tracking-wider py-1 px-2 border border-transparent hover:border-[#0B6B4F] dark:hover:border-[#10B981] transition-all"
                    >
                      <span>Submit</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#CCCCCC] dark:text-[#4B5563]">—</span>
                  )}
                </td>

                {/* Actions / Details Modal Trigger */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onOpenSubmissionModal(item)}
                    className="p-1.5 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] hover:bg-[#EAEAEA] dark:hover:bg-[#26292E] rounded transition-colors"
                    title="Edit Notes & Live Link"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
