'use client';

import React, { useState } from 'react';
import { X, Globe, Plus, Check, Trash2 } from 'lucide-react';

export default function ProjectSelector({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      website_url: url.trim() || 'https://mywebsite.com',
    });

    setName('');
    setUrl('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F7F7F7] dark:bg-[#141619] border border-[#111111] dark:border-[#26292E] max-w-md w-full p-6 sm:p-8 shadow-2xl relative transition-colors">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
            CAMPAIGN TARGETS
          </div>
          <h2 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
            PROJECT / WEBSITES
          </h2>
          <p className="text-xs text-[#888888] dark:text-[#9CA3AF] mt-1">
            Switch between different products or add new client websites to isolate backlink tracking.
          </p>
        </div>

        {/* Project List */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                className={`p-3.5 border flex items-center justify-between transition-colors ${
                  isActive
                    ? 'border-[#0B6B4F] dark:border-[#10B981] bg-white dark:bg-[#1A1D21] shadow-sm'
                    : 'border-[#E0E0E0] dark:border-[#26292E] bg-white dark:bg-[#1A1D21] hover:border-[#111111] dark:hover:border-[#F3F4F6]'
                }`}
              >
                <button
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className="flex items-center space-x-3 text-left flex-1"
                >
                  <Globe
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#0B6B4F] dark:text-[#10B981]' : 'text-[#888888] dark:text-[#9CA3AF]'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold text-[#111111] dark:text-[#F3F4F6]">{p.name}</div>
                    <div className="text-xs text-[#888888] dark:text-[#9CA3AF] font-mono">
                      {p.website_url}
                    </div>
                  </div>
                </button>

                <div className="flex items-center space-x-2">
                  {isActive && (
                    <span className="text-xs text-[#0B6B4F] dark:text-[#10B981] font-bold flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  )}
                  {projects.length > 1 && (
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1 text-[#888888] dark:text-[#9CA3AF] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete Project"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Project Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-3 pt-4 border-t border-[#E0E0E0] dark:border-[#26292E]">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Content Writer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] px-3 py-2 text-sm text-[#111111] dark:text-[#F3F4F6] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Website URL
              </label>
              <input
                type="url"
                placeholder="https://mywebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] px-3 py-2 text-sm text-[#111111] dark:text-[#F3F4F6] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 text-xs font-bold uppercase text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#0B6B4F] dark:bg-[#10B981] hover:bg-[#08523C] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold px-4 py-2 text-xs font-bold uppercase tracking-widest-editorial"
              >
                Create Project
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center space-x-2 border border-dashed border-[#111111] dark:border-[#4B5563] hover:bg-white dark:hover:bg-[#1A1D21] text-[#111111] dark:text-[#F3F4F6] py-2.5 text-xs font-bold uppercase tracking-widest-editorial transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ADD NEW PROJECT</span>
          </button>
        )}
      </div>
    </div>
  );
}
