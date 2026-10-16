'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INITIAL_SOURCES, STATUS_LABELS } from '@/lib/data/sources';

// Decorative preview of the submission workflow: three of the highest-DR
// directories cycling through the same statuses the real tracker uses.
const FLOW = ['unsubmitted', 'on_progress', 'submitted', 'secured'];

const PILL = {
  unsubmitted: 'bg-[#F3F4F6] text-[#4B5563] dark:bg-[#22262B] dark:text-[#9CA3AF]',
  on_progress: 'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-500/15 dark:text-amber-300',
  submitted: 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-blue-500/15 dark:text-blue-300',
  secured: 'bg-[#E8F3EE] text-[#0B6B4F] dark:bg-[#10B981]/15 dark:text-[#10B981]',
};

const TOP_SOURCES = [...INITIAL_SOURCES].sort((a, b) => b.dr - a.dr).slice(0, 3);
const OFFSETS = [0, 1, 2];

export default function WorkflowDemo() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTick(3);
      return;
    }
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-md mx-auto lg:ml-auto"
    >
      <div className="absolute -inset-4 bg-[#0B6B4F]/10 dark:bg-[#10B981]/10 blur-2xl rounded-full animate-float-slow" />

      <div className="relative bg-white dark:bg-[#141619] border border-[#111111] dark:border-[#26292E] shadow-2xl transition-colors">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E0E0E0] dark:border-[#26292E]">
          <div className="text-[10px] font-bold tracking-widest-editorial uppercase text-[#888888] dark:text-[#9CA3AF]">
            Submission workflow
          </div>
          <div className="flex space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0E0E0] dark:bg-[#26292E]" />
            <span className="w-2 h-2 rounded-full bg-[#E0E0E0] dark:bg-[#26292E]" />
            <span className="w-2 h-2 rounded-full bg-[#0B6B4F] dark:bg-[#10B981]" />
          </div>
        </div>

        <div className="divide-y divide-[#E0E0E0] dark:divide-[#26292E]">
          {TOP_SOURCES.map((source, i) => {
            const status = FLOW[(tick + OFFSETS[i]) % FLOW.length];
            return (
              <div
                key={source.id}
                className="flex items-center justify-between px-5 py-4 animate-float"
                style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${6 + i}s` }}
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#111111] dark:text-[#F3F4F6] truncate">
                    {source.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#888888] dark:text-[#9CA3AF]">
                    DR {source.dr} · {source.domain}
                  </div>
                </div>
                <span
                  className={`ml-3 flex-shrink-0 inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${PILL[status]}`}
                >
                  {status === 'secured' && <CheckCircle2 className="w-3 h-3" />}
                  <span>{STATUS_LABELS[status]}</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-[#E0E0E0] dark:border-[#26292E] flex items-center justify-between text-[10px] font-mono text-[#888888] dark:text-[#9CA3AF]">
          <span>UNSUBMITTED → SECURED</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B6B4F] dark:bg-[#10B981] animate-pulse" />
            <span>LIVE TRACKING</span>
          </span>
        </div>
      </div>
    </div>
  );
}
