'use client';

import React from 'react';
import { User, LogIn, LogOut, Globe, ShieldCheck, Sun, Moon } from 'lucide-react';

export default function Header({
  activeProject,
  onOpenProjectModal,
  user,
  onOpenAuthModal,
  onSignOut,
  securedCount,
  freeLimit,
  isCloudConnected,
  theme,
  onToggleTheme,
  variant = 'app', // 'landing' hides the project switcher and quota badge
  onGoHome,
}) {
  const isLanding = variant === 'landing';

  return (
    <header className="w-full bg-[#F7F7F7] dark:bg-[#141619] border-b border-[#E0E0E0] dark:border-[#26292E] sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Column: Editorial Tagline */}
        <div className="hidden md:flex items-center space-x-3 text-xs tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] font-medium uppercase">
          <span className="w-2 h-2 rounded-full bg-[#0B6B4F] dark:bg-[#10B981]"></span>
          <span>CURATED DIRECTORY & SUBMISSION TRACKER</span>
        </div>

        {/* Center Column: Stylized Swiss Logo */}
        <div className="flex items-center justify-center">
          <a
            href="/"
            onClick={(e) => {
              if (onGoHome) {
                e.preventDefault();
                onGoHome();
              }
            }}
            title="Home"
            className="group flex items-center space-x-1"
          >
            <span className="font-extrabold text-xl tracking-tight text-[#111111] dark:text-[#F3F4F6]">
              SEO
            </span>
            <span className="text-[#0B6B4F] dark:text-[#10B981] text-2xl font-black transform -rotate-12 group-hover:rotate-0 transition-transform">
              /
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#111111] dark:text-[#F3F4F6]">
              BL
            </span>
          </a>
        </div>

        {/* Right Column: Dark Mode Toggle, Project Switcher & User Profile / Login */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded border border-[#E0E0E0] dark:border-[#26292E] bg-white dark:bg-[#1A1D21] text-[#111111] dark:text-[#F3F4F6] hover:border-[#111111] dark:hover:border-[#10B981] transition-colors flex items-center space-x-1.5"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#374151]" />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Active Project Switcher Pill */}
          {!isLanding && (
            <button
              onClick={onOpenProjectModal}
              className="flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded border border-[#E0E0E0] dark:border-[#26292E] bg-white dark:bg-[#1A1D21] hover:border-[#111111] dark:hover:border-[#F3F4F6] transition-colors text-[#111111] dark:text-[#F3F4F6]"
              title="Switch or manage active website/project"
            >
              <Globe className="w-3.5 h-3.5 text-[#0B6B4F] dark:text-[#10B981]" />
              <span className="max-w-[120px] truncate">{activeProject?.name || 'My SaaS'}</span>
            </button>
          )}

          {/* Secured quota badge */}
          {!isLanding && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#E8F3EE] dark:bg-[#10B981]/15 border border-[#0B6B4F]/20 dark:border-[#10B981]/30 text-xs text-[#0B6B4F] dark:text-[#10B981] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {securedCount}
                {user ? ' Secured' : ` / ${freeLimit} Free`}
              </span>
            </div>
          )}

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-[#111111] dark:text-[#F3F4F6] hidden lg:inline-block">
                {user.email || user.name || 'Account'}
              </span>
              <button
                onClick={onSignOut}
                className="p-1.5 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('signin')}
              className="flex items-center space-x-1.5 bg-[#111111] dark:bg-[#F3F4F6] text-white dark:text-[#111111] hover:bg-[#0B6B4F] dark:hover:bg-[#10B981] dark:hover:text-white text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
