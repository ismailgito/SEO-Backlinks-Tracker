'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Filters from '@/components/Filters';
import CatalogTable from '@/components/CatalogTable';
import CatalogGrid from '@/components/CatalogGrid';
import DashboardView from '@/components/DashboardView';
import SubmissionModal from '@/components/SubmissionModal';
import AuthModal from '@/components/AuthModal';
import ProjectSelector from '@/components/ProjectSelector';
import Footer from '@/components/Footer';

import {
  INITIAL_SOURCES,
  getAllCategories,
} from '@/lib/data/sources';

import {
  getStoredSession,
  saveStoredSession,
  getProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
  getSubmissions,
  getEvents,
  recordSubmission,
  exportDataAsCsv,
  FREE_LIMIT,
} from '@/lib/storage';

import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Layers,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState('light');

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'dashboard'

  // App State
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveId] = useState('');
  const [submissions, setSubmissionsState] = useState({});
  const [events, setEventsState] = useState([]);

  // Modals
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [selectedSourceForModal, setSelectedSourceForModal] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup');
  const [authLimitReason, setAuthLimitReason] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState('All');
  const [selectedFollow, setSelectedFollow] = useState('All');
  const [selectedWorkflow, setSelectedWorkflow] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const allCategories = useMemo(() => getAllCategories(), []);

  // Initialize theme and data from local storage
  useEffect(() => {
    // 1. Initialize Theme
    const savedTheme = localStorage.getItem('seo_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Initialize Session and Projects
    const session = getStoredSession();
    if (session) setUser(session);

    const projs = getProjects();
    setProjects(projs);

    const activeId = getActiveProjectId();
    setActiveId(activeId);

    const subs = getSubmissions(activeId);
    setSubmissionsState(subs);

    const evs = getEvents(activeId);
    setEventsState(evs);
  }, []);

  // Keep app state in sync with the Supabase OTP session (cookie-persisted)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();

    const toAppUser = (sbUser) => ({
      id: sbUser.id,
      email: sbUser.email,
      name:
        sbUser.user_metadata?.name ||
        sbUser.user_metadata?.full_name ||
        (sbUser.email ? sbUser.email.split('@')[0] : 'Account'),
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const sbUser = toAppUser(session.user);
        setUser(sbUser);
        saveStoredSession(sbUser);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        saveStoredSession(null);
      } else if (session?.user) {
        const sbUser = toAppUser(session.user);
        setUser(sbUser);
        saveStoredSession(sbUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Toggle Theme handler
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('seo_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync state when active project changes
  const reloadProjectData = (projId) => {
    setActiveId(projId);
    setActiveProjectId(projId);
    setSubmissionsState(getSubmissions(projId));
    setEventsState(getEvents(projId));
    setCurrentPage(1);
  };

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  const securedCount = useMemo(() => {
    return Object.values(submissions).filter((s) => s.status === 'secured').length;
  }, [submissions]);

  // Overall catalog stats
  const totalSources = INITIAL_SOURCES.length;
  const dofollowCount = useMemo(
    () => INITIAL_SOURCES.filter((s) => s.source_follow_status === 'dofollow').length,
    []
  );
  const dr90Count = useMemo(
    () => INITIAL_SOURCES.filter((s) => s.dr >= 90).length,
    []
  );

  // Filtered Sources
  const filteredSources = useMemo(() => {
    return INITIAL_SOURCES.filter((item) => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDomain = (item.domain || '').toLowerCase().includes(query);
        const matchCat = (item.categories || []).some((c) =>
          c.toLowerCase().includes(query)
        );
        if (!matchName && !matchDomain && !matchCat) return false;
      }

      // DR Band
      if (selectedBand !== 'All' && item.dr_band !== selectedBand) {
        return false;
      }

      // Follow Status
      if (
        selectedFollow !== 'All' &&
        item.source_follow_status !== selectedFollow
      ) {
        return false;
      }

      // Workflow Status
      if (selectedWorkflow !== 'All') {
        const sub = submissions[item.id];
        const status = sub?.status || 'unsubmitted';
        if (selectedWorkflow === 'unsubmitted') {
          if (status !== 'unsubmitted') return false;
        } else if (status !== selectedWorkflow) {
          return false;
        }
      }

      // Category
      if (
        selectedCategory !== 'All' &&
        !(item.categories || []).includes(selectedCategory)
      ) {
        return false;
      }

      return true;
    });
  }, [
    searchTerm,
    selectedBand,
    selectedFollow,
    selectedWorkflow,
    selectedCategory,
    submissions,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSources.length / pageSize) || 1;
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSources.slice(start, start + pageSize);
  }, [filteredSources, currentPage, pageSize]);

  // Handle Submission update
  const handleSaveSubmission = ({ source, newStatus, liveUrl, notes }) => {
    const result = recordSubmission({
      projectId: activeProjectId,
      sourceId: source.id,
      sourceName: source.name,
      newStatus,
      liveUrl,
      notes,
      user,
    });

    if (!result.success) {
      if (result.requiresAuth) {
        setAuthLimitReason(result.reason);
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
      }
      return result;
    }

    setSubmissionsState(getSubmissions(activeProjectId));
    setEventsState(getEvents(activeProjectId));
    return result;
  };

  const handleQuickStatusChange = (source, newStatus) => {
    const existing = submissions[source.id] || {};
    handleSaveSubmission({
      source,
      newStatus,
      liveUrl: existing.live_url || '',
      notes: existing.notes || '',
    });
  };

  // Auth Callbacks
  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser);
    saveStoredSession(loggedUser);
    setAuthLimitReason('');
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    setUser(null);
    saveStoredSession(null);
    if (isSupabaseConfigured()) {
      try {
        await getSupabaseBrowserClient().auth.signOut();
      } catch {
        // Session already cleared locally
      }
    }
  };

  // Project Management
  const handleCreateProject = ({ name, website_url }) => {
    const newProj = {
      id: `proj-${Date.now()}`,
      name,
      website_url,
      created_at: new Date().toISOString(),
    };
    const updated = [...projects, newProj];
    setProjects(updated);
    saveProjects(updated);
    reloadProjectData(newProj.id);
  };

  const handleDeleteProject = (projId) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== projId);
    setProjects(remaining);
    saveProjects(remaining);
    if (activeProjectId === projId) {
      reloadProjectData(remaining[0].id);
    }
  };

  const scrollToCatalog = () => {
    setActiveTab('catalog');
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSupabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7] dark:bg-[#0C0D0E] transition-colors duration-200">
      {/* 1. Header (Top Bar with Dark Mode Toggle) */}
      <Header
        activeProject={activeProject}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        user={user}
        onOpenAuthModal={(mode) => {
          setAuthLimitReason('');
          setAuthModalMode(mode || 'signup');
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
        securedCount={securedCount}
        freeLimit={FREE_LIMIT}
        isCloudConnected={isSupabaseReady}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Hero Section */}
      <Hero
        totalSources={totalSources}
        dofollowCount={dofollowCount}
        dr90Count={dr90Count}
        securedCount={securedCount}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* 3. Main Navigation Tabs */}
      <div className="bg-white dark:bg-[#141619] border-b border-[#E0E0E0] dark:border-[#26292E] sticky top-16 z-30 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`py-4 text-xs font-bold uppercase tracking-widest-editorial border-b-2 transition-all flex items-center space-x-2 ${
                  activeTab === 'catalog'
                    ? 'border-[#0B6B4F] dark:border-[#10B981] text-[#111111] dark:text-[#F3F4F6]'
                    : 'border-transparent text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>DIRECTORIES CATALOG ({INITIAL_SOURCES.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 text-xs font-bold uppercase tracking-widest-editorial border-b-2 transition-all flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'border-[#0B6B4F] dark:border-[#10B981] text-[#111111] dark:text-[#F3F4F6]'
                    : 'border-transparent text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>ANALYTICS & REPORTING</span>
              </button>
            </div>

            {/* Guest Quota Alert Pill */}
            {!user && (
              <div className="text-xs text-[#888888] dark:text-[#9CA3AF] hidden md:flex items-center space-x-2 font-mono">
                <span>Free Guest Limit:</span>
                <span className="font-bold text-[#0B6B4F] dark:text-[#10B981]">
                  {securedCount} / {FREE_LIMIT} Secured
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tab Contents */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" id="catalog-section">
        {/* TAB 1: CATALOG VIEW */}
        {activeTab === 'catalog' && (
          <div>
            {/* Filter controls */}
            <Filters
              searchTerm={searchTerm}
              setSearchTerm={(term) => {
                setSearchTerm(term);
                setCurrentPage(1);
              }}
              selectedBand={selectedBand}
              setSelectedBand={(band) => {
                setSelectedBand(band);
                setCurrentPage(1);
              }}
              selectedFollow={selectedFollow}
              setSelectedFollow={(f) => {
                setSelectedFollow(f);
                setCurrentPage(1);
              }}
              selectedWorkflow={selectedWorkflow}
              setSelectedWorkflow={(wf) => {
                setSelectedWorkflow(wf);
                setCurrentPage(1);
              }}
              selectedCategory={selectedCategory}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              categories={allCategories}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onResetFilters={() => {
                setSearchTerm('');
                setSelectedBand('All');
                setSelectedFollow('All');
                setSelectedWorkflow('All');
                setSelectedCategory('All');
                setCurrentPage(1);
              }}
              totalResults={filteredSources.length}
              totalInventory={INITIAL_SOURCES.length}
            />

            {/* Table or Grid */}
            {viewMode === 'table' ? (
              <CatalogTable
                sources={paginatedSources}
                submissions={submissions}
                onOpenSubmissionModal={(source) => {
                  setSelectedSourceForModal(source);
                  setIsSubmissionModalOpen(true);
                }}
                onQuickStatusChange={handleQuickStatusChange}
              />
            ) : (
              <CatalogGrid
                sources={paginatedSources}
                submissions={submissions}
                onOpenSubmissionModal={(source) => {
                  setSelectedSourceForModal(source);
                  setIsSubmissionModalOpen(true);
                }}
                onQuickStatusChange={handleQuickStatusChange}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-4 transition-colors">
                <div className="text-xs text-[#888888] dark:text-[#9CA3AF]">
                  Page <strong className="text-[#111111] dark:text-[#F3F4F6]">{currentPage}</strong> of{' '}
                  <strong className="text-[#111111] dark:text-[#F3F4F6]">{totalPages}</strong> (
                  {filteredSources.length} total directories)
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-1 px-3 py-1.5 border border-[#E0E0E0] dark:border-[#26292E] text-xs uppercase font-bold disabled:opacity-40 hover:border-[#111111] dark:hover:border-[#F3F4F6] text-[#111111] dark:text-[#F3F4F6] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>PREV</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pageNums = [];
                      const seen = new Set();
                      for (let i = 0; i < Math.min(5, totalPages); i++) {
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 3 + i;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        pageNum = Math.max(1, pageNum);
                        if (!seen.has(pageNum)) {
                          seen.add(pageNum);
                          pageNums.push(pageNum);
                        }
                      }
                      return pageNums.map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 text-xs font-mono font-bold transition-colors ${
                            currentPage === pageNum
                              ? 'bg-[#111111] dark:bg-[#F3F4F6] text-white dark:text-[#111111]'
                              : 'bg-[#F7F7F7] dark:bg-[#1A1D21] text-[#555555] dark:text-[#9CA3AF] hover:bg-[#EAEAEA] dark:hover:bg-[#26292E]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-1 px-3 py-1.5 border border-[#E0E0E0] dark:border-[#26292E] text-xs uppercase font-bold disabled:opacity-40 hover:border-[#111111] dark:hover:border-[#F3F4F6] text-[#111111] dark:text-[#F3F4F6] transition-colors"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <DashboardView
            sources={INITIAL_SOURCES}
            submissions={submissions}
            events={events}
            onExportCsv={() => exportDataAsCsv(activeProjectId, INITIAL_SOURCES)}
            onOpenSubmissionModal={(source) => {
              setSelectedSourceForModal(source);
              setIsSubmissionModalOpen(true);
            }}
          />
        )}
      </main>

      {/* 5. Modals */}
      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setSelectedSourceForModal(null);
        }}
        source={selectedSourceForModal}
        currentSubmission={
          selectedSourceForModal ? submissions[selectedSourceForModal.id] : null
        }
        onSave={handleSaveSubmission}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthLimitReason('');
        }}
        initialMode={authModalMode}
        limitReachedReason={authLimitReason}
        onSuccess={handleAuthSuccess}
      />

      <ProjectSelector
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={reloadProjectData}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* 6. Footer */}
      <Footer onScrollToTop={scrollToTop} />
    </div>
  );
}
