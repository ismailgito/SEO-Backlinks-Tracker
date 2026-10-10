'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-8 sm:p-12 max-w-md w-full shadow-sm transition-colors">
        <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight mb-2">
          Something Went Wrong
        </h2>
        <p className="text-xs text-[#888888] dark:text-[#9CA3AF] mb-6 leading-relaxed">
          {error?.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center space-x-2 bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
