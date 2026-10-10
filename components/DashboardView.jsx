'use client';

import React, { useState } from 'react';
import {
  PieChart as PieIcon,
  Clock,
  Download,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/data/sources';

export default function DashboardView({
  sources,
  submissions,
  events,
  onExportCsv,
  onOpenSubmissionModal,
}) {
  const [includeUnsubmittedInChart, setIncludeUnsubmittedInChart] = useState(false);

  // Calculate metrics
  const totalSources = sources.length;
  const submissionsList = Object.values(submissions);

  const securedList = submissionsList.filter((s) => s.status === 'secured');
  const submittedList = submissionsList.filter((s) => s.status === 'submitted');
  const onProgressList = submissionsList.filter((s) => s.status === 'on_progress');
  const rejectedList = submissionsList.filter(
    (s) => s.status === 'rejected' || s.status === 'unable'
  );
  const unsubmittedCount =
    totalSources -
    (securedList.length + submittedList.length + onProgressList.length + rejectedList.length);

  const securedCount = securedList.length;
  const submittedCount = submittedList.length;
  const onProgressCount = onProgressList.length;
  const rejectedCount = rejectedList.length;

  const totalTracked = securedCount + submittedCount + onProgressCount + rejectedCount;

  // Dofollow vs nofollow among secured backlinks
  const securedSourcesMap = new Map();
  sources.forEach((s) => securedSourcesMap.set(s.id, s));

  let securedDofollow = 0;
  let securedNofollow = 0;
  let securedUnverified = 0;

  securedList.forEach((sub) => {
    const src = securedSourcesMap.get(sub.sourceId);
    if (src) {
      if (src.source_follow_status === 'dofollow') securedDofollow++;
      else if (src.source_follow_status === 'nofollow') securedNofollow++;
      else securedUnverified++;
    }
  });

  // DR Band distribution of secured links
  const bandSecuredCount = {};
  securedList.forEach((sub) => {
    const src = securedSourcesMap.get(sub.sourceId);
    if (src) {
      bandSecuredCount[src.dr_band] = (bandSecuredCount[src.dr_band] || 0) + 1;
    }
  });

  // Chart data slices
  const chartSlices = [
    { label: 'Secured', count: securedCount, color: '#10B981' },
    { label: 'Submitted (Pending)', count: submittedCount, color: '#3B82F6' },
    { label: 'On Progress', count: onProgressCount, color: '#F59E0B' },
    { label: 'Rejected / Unable', count: rejectedCount, color: '#EF4444' },
  ];

  if (includeUnsubmittedInChart) {
    chartSlices.push({
      label: 'Unsubmitted',
      count: Math.max(0, unsubmittedCount),
      color: '#6B7280',
    });
  }

  const chartTotal = chartSlices.reduce((sum, s) => sum + s.count, 0);

  // SVG Doughnut Generator
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;
  const paths = chartSlices.map((slice) => {
    const fraction = chartTotal > 0 ? slice.count / chartTotal : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -currentAngle * circumference;
    currentAngle += fraction;
    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
      percentage: chartTotal > 0 ? ((slice.count / chartTotal) * 100).toFixed(1) : 0,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Controls & Export Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-4 sm:p-6 transition-colors">
        <div>
          <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
            CAMPAIGN PERFORMANCE
          </div>
          <h2 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
            SEO BACKLINKS DASHBOARD
          </h2>
          <p className="text-xs text-[#888888] dark:text-[#9CA3AF] mt-1">
            Real-time tracking of submissions, live backlinks, and authority progression.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="flex items-center space-x-2 bg-[#111111] dark:bg-[#F3F4F6] hover:bg-[#0B6B4F] dark:hover:bg-[#10B981] text-white dark:text-[#111111] dark:hover:text-[#0C0D0E] px-5 py-2.5 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-5 transition-colors">
          <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mb-1">
            Total Inventory
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
            {totalSources}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#9CA3AF] mt-2">
            {totalSources}+ Curated directories
          </div>
        </div>

        <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-5 transition-colors">
          <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mb-1">
            Tracked Submissions
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
            {totalTracked}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#9CA3AF] mt-2">
            {((totalTracked / totalSources) * 100).toFixed(0)}% of catalog touched
          </div>
        </div>

        <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-5 transition-colors">
          <div className="text-[10px] font-bold tracking-widest-editorial text-[#0B6B4F] dark:text-[#10B981] uppercase mb-1">
            Secured Backlinks
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#0B6B4F] dark:text-[#10B981] tracking-tight">
            {securedCount}
          </div>
          <div className="text-[11px] text-[#0B6B4F] dark:text-[#10B981] font-semibold mt-2">
            Confirmed live links
          </div>
        </div>

        <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-5 transition-colors">
          <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mb-1">
            Secured Dofollow Ratio
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
            {securedCount > 0 ? `${Math.round((securedDofollow / securedCount) * 100)}%` : '0%'}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#9CA3AF] mt-2">
            {securedDofollow} Dofollow / {securedNofollow} Nofollow
          </div>
        </div>
      </div>

      {/* Main Visualizations: Pie Chart & Authority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Workflow Status Doughnut Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-6 sm:p-8 transition-colors">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E0E0E0] dark:border-[#26292E]">
            <div>
              <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase">
                Workflow Distribution
              </div>
              <h3 className="text-lg font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
                Submission Outcomes
              </h3>
            </div>

            <label className="flex items-center space-x-2 text-xs text-[#666666] dark:text-[#9CA3AF] cursor-pointer">
              <input
                type="checkbox"
                checked={includeUnsubmittedInChart}
                onChange={(e) => setIncludeUnsubmittedInChart(e.target.checked)}
                className="accent-[#0B6B4F] dark:accent-[#10B981]"
              />
              <span>Include unsubmitted</span>
            </label>
          </div>

          {chartTotal === 0 ? (
            <div className="py-16 text-center text-[#888888] dark:text-[#9CA3AF]">
              <PieIcon className="w-12 h-12 mx-auto mb-3 text-[#CCCCCC] dark:text-[#4B5563]" />
              <p className="text-sm font-medium text-[#111111] dark:text-[#F3F4F6]">No submission actions tracked yet.</p>
              <p className="text-xs mt-1">Start tracking directories in the catalog to generate chart data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              {/* SVG Chart */}
              <div className="flex justify-center items-center relative py-4">
                <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke="#F3F4F6"
                    className="stroke-[#F3F4F6] dark:stroke-[#26292E]"
                    strokeWidth={strokeWidth}
                  />
                  {paths.map(
                    (p, i) =>
                      p.count > 0 && (
                        <circle
                          key={i}
                          cx="100"
                          cy="100"
                          r={radius}
                          fill="transparent"
                          stroke={p.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={p.strokeDasharray}
                          strokeDashoffset={p.strokeDashoffset}
                          className="transition-all duration-500 ease-out"
                        />
                      )
                  )}
                </svg>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-[#111111] dark:text-[#F3F4F6]">{securedCount}</span>
                  <span className="text-[10px] tracking-widest-editorial font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase">
                    Secured
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-3">
                {paths.map((slice, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      ></span>
                      <span className="font-semibold text-[#111111] dark:text-[#F3F4F6]">{slice.label}</span>
                    </div>
                    <div className="font-mono text-[#666666] dark:text-[#9CA3AF]">
                      <span className="font-bold text-[#111111] dark:text-[#F3F4F6]">{slice.count}</span> ({slice.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right (5 cols): Authority Distribution of Secured Links */}
        <div className="lg:col-span-5 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-6 sm:p-8 transition-colors">
          <div className="mb-6 pb-4 border-b border-[#E0E0E0] dark:border-[#26292E]">
            <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase">
              Authority Bands
            </div>
            <h3 className="text-lg font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
              Secured Links by DR Tier
            </h3>
          </div>

          <div className="space-y-3.5">
            {['90+', '80–89', '70–79', '60–69', '50–59', '40–49', '30–39', '20–29', '10–19', '<10'].map(
              (band) => {
                const count = bandSecuredCount[band] || 0;
                const totalInBand = sources.filter((s) => s.dr_band === band).length;
                const percentage = totalInBand > 0 ? (count / totalInBand) * 100 : 0;

                return (
                  <div key={band} className="text-xs">
                    <div className="flex items-center justify-between font-mono mb-1">
                      <span className="font-bold text-[#111111] dark:text-[#F3F4F6]">DR {band}</span>
                      <span className="text-[#888888] dark:text-[#9CA3AF]">
                        <strong className="text-[#0B6B4F] dark:text-[#10B981]">{count}</strong> / {totalInBand} secured
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F0F0F0] dark:bg-[#26292E] overflow-hidden">
                      <div
                        className="h-full bg-[#0B6B4F] dark:bg-[#10B981] transition-all duration-300"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-6 sm:p-8 transition-colors">
        <div className="mb-6 pb-4 border-b border-[#E0E0E0] dark:border-[#26292E] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase">
              Audit & Timestamps
            </div>
            <h3 className="text-lg font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
              Recent Activity Log
            </h3>
          </div>
          <span className="text-xs text-[#888888] dark:text-[#9CA3AF] uppercase tracking-wider font-mono">
            Local Timezone
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#888888] dark:text-[#9CA3AF]">
            No status changes logged yet. Every status update and secured backlink is recorded here.
          </div>
        ) : (
          <div className="divide-y divide-[#E0E0E0] dark:divide-[#26292E]">
            {events.slice(0, 10).map((ev) => {
              const statusColor = STATUS_COLORS[ev.newStatus] || STATUS_COLORS.unsubmitted;
              const formattedDate = new Date(ev.timestamp).toLocaleString();

              return (
                <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                      }}
                    >
                      {STATUS_LABELS[ev.newStatus] || ev.newStatus}
                    </span>
                    <span className="font-bold text-[#111111] dark:text-[#F3F4F6]">{ev.sourceName}</span>
                    {ev.liveUrl && (
                      <span className="text-[#0B6B4F] dark:text-[#10B981] font-mono truncate max-w-xs hidden md:inline">
                        ({ev.liveUrl})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 text-[#888888] dark:text-[#9CA3AF] font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
