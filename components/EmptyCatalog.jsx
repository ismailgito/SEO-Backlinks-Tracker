'use client';

import React from 'react';

export default function EmptyCatalog() {
  return (
    <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-12 text-center transition-colors">
      <p className="text-base text-[#555555] dark:text-[#9CA3AF] mb-2 font-medium">No backlink directories match your filters.</p>
      <p className="text-xs text-[#888888] dark:text-[#6B7280]">Try resetting your search or filter options to view available sources.</p>
    </div>
  );
}
