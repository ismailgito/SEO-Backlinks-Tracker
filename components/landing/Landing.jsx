'use client';

import React, { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  ListChecks,
  BarChart3,
  Globe,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { INITIAL_SOURCES } from '@/lib/data/sources';
import { FREE_LIMIT } from '@/lib/storage';
import Reveal from '@/components/landing/Reveal';
import CountUp from '@/components/landing/CountUp';
import WorkflowDemo from '@/components/landing/WorkflowDemo';
import CreatorSection from '@/components/landing/CreatorSection';

const STEPS = [
  {
    icon: Layers,
    title: 'Browse the catalog',
    text: `Filter ${INITIAL_SOURCES.length} vetted directories by Domain Rating, follow type, category, and your own progress.`,
  },
  {
    icon: ListChecks,
    title: 'Submit & track',
    text: 'Move each directory from Unsubmitted to Secured and log the live URL, notes, and timestamps.',
  },
  {
    icon: BarChart3,
    title: 'Report results',
    text: 'See outcomes by status and DR tier, review the audit trail, and export everything to CSV.',
  },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Curated, spam-free', text: 'Every source is cleaned and grouped into 10 Domain Rating bands.' },
  { icon: Sparkles, title: 'Follow status shown', text: 'Dofollow, nofollow, or unverified is visible before you spend time submitting.' },
  { icon: Globe, title: 'Multi-project', text: 'Track several websites or clients side by side without mixing data.' },
  { icon: Download, title: 'One-click export', text: 'Download your full submission history as a CSV any time.' },
];

const primaryBtn =
  'group inline-flex items-center justify-center space-x-2 bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] px-7 py-4 text-xs uppercase tracking-widest-editorial font-bold transition-colors animate-ring';
const secondaryBtn =
  'group inline-flex items-center justify-center space-x-2 bg-white dark:bg-[#1A1D21] border border-[#111111] dark:border-[#3B4048] hover:bg-[#111111] hover:text-white dark:hover:bg-[#F3F4F6] dark:hover:text-[#111111] text-[#111111] dark:text-[#F3F4F6] px-7 py-4 text-xs uppercase tracking-widest-editorial font-bold transition-colors';

const enter = (i) => ({ animationDelay: `${i * 120}ms` });

// The two (and only two) calls to action: `primaryCta` is "Sign up for free"
// for guests, "Open Dashboard" once signed in; `onExplore` opens the catalog.
function CtaPair({ primaryCta, onExplore }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <button type="button" onClick={primaryCta.onClick} className={primaryBtn}>
        <span>{primaryCta.label}</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </button>
      <button type="button" onClick={onExplore} className={secondaryBtn}>
        <span>Explore Backlinks</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export default function Landing({ primaryCta, onExplore }) {
  const stats = useMemo(
    () => ({
      total: INITIAL_SOURCES.length,
      dofollow: INITIAL_SOURCES.filter((s) => s.source_follow_status === 'dofollow').length,
      dr90: INITIAL_SOURCES.filter((s) => s.dr >= 90).length,
    }),
    []
  );

  // Highest-DR names for the scrolling ticker (list is doubled for a seamless loop)
  const tickerNames = useMemo(
    () =>
      [...INITIAL_SOURCES]
        .sort((a, b) => b.dr - a.dr)
        .slice(0, 24)
        .map((s) => ({ id: s.id, name: s.name, dr: s.dr })),
    []
  );

  return (
    <div className="w-full">
      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#F7F7F7] dark:bg-[#0C0D0E] border-b border-[#E0E0E0] dark:border-[#26292E] transition-colors">
        <div className="landing-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0B6B4F]/15 dark:bg-[#10B981]/10 blur-3xl animate-float-slow"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-[#10B981]/15 dark:bg-[#10B981]/10 blur-3xl animate-float-slow"
          style={{ animationDelay: '-7s' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-7">
              <div
                className="animate-fade-up text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] tracking-widest-editorial uppercase mb-4 flex items-center space-x-2"
                style={enter(0)}
              >
                <Sparkles className="w-4 h-4" />
                <span>{stats.total} free directory submission sites · 2026 edition</span>
              </div>

              <h1
                className="animate-fade-up text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight leading-[0.95] mb-6"
                style={enter(1)}
              >
                AWESOME FREE <br />
                <span className="text-shimmer animate-shimmer">SEO BACKLINKS</span>
              </h1>

              <p
                className="animate-fade-up text-base sm:text-lg text-[#555555] dark:text-[#9CA3AF] max-w-xl leading-relaxed mb-5"
                style={enter(2)}
              >
                Build link equity, grow your Domain Rating, and get discovered by AI search engines.
                Track every directory submission from first click to live backlink.
              </p>

              <div
                className="animate-fade-up w-16 h-1 bg-[#0B6B4F] dark:bg-[#10B981] mb-8"
                style={enter(3)}
              />

              <div className="animate-fade-up" style={enter(4)}>
                <CtaPair primaryCta={primaryCta} onExplore={onExplore} />
              </div>

              <div
                className="animate-fade-up mt-6 text-xs text-[#888888] dark:text-[#9CA3AF] tracking-wider uppercase flex items-center space-x-2"
                style={enter(5)}
              >
                <CheckCircle2 className="w-4 h-4 text-[#0B6B4F] dark:text-[#10B981]" />
                <span>Zero spam · 100% free submissions · {FREE_LIMIT} free secured links</span>
              </div>
            </div>

            <div className="lg:col-span-5 animate-fade-up" style={enter(3)}>
              <WorkflowDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DIRECTORY TICKER ─────────────────────────────────────────── */}
      <section
        aria-label="Highest authority directories in the catalog"
        className="bg-white dark:bg-[#141619] border-b border-[#E0E0E0] dark:border-[#26292E] overflow-hidden py-5 transition-colors"
      >
        <div className="marquee-track flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex flex-shrink-0 items-center" aria-hidden={copy === 1}>
              {tickerNames.map((s) => (
                <div
                  key={`${copy}-${s.id}`}
                  className="flex items-center space-x-3 px-6 text-sm font-bold uppercase tracking-wider text-[#111111] dark:text-[#F3F4F6] whitespace-nowrap"
                >
                  <span>{s.name}</span>
                  <span className="text-[11px] font-mono font-bold text-[#0B6B4F] dark:text-[#10B981]">
                    DR {s.dr}
                  </span>
                  <span className="text-[#E0E0E0] dark:text-[#3B4048]">/</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. STATS ────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] dark:bg-[#0C0D0E] py-14 md:py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Curated directories', value: stats.total, accent: false },
              { label: 'Dofollow sources', value: stats.dofollow, accent: true },
              { label: 'DR 90+ sources', value: stats.dr90, accent: false },
              { label: 'Free secured links', value: FREE_LIMIT, accent: true },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 100}>
                <div className="bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-6 hover:-translate-y-1 hover:border-[#111111] dark:hover:border-[#10B981] transition-all duration-300">
                  <CountUp
                    value={item.value}
                    className={`block text-4xl sm:text-5xl font-extrabold tracking-tight ${
                      item.accent
                        ? 'text-[#0B6B4F] dark:text-[#10B981]'
                        : 'text-[#111111] dark:text-[#F3F4F6]'
                    }`}
                  />
                  <div className="text-[11px] font-semibold tracking-widest-editorial text-[#888888] dark:text-[#9CA3AF] uppercase mt-2">
                    {item.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] dark:bg-[#0C0D0E] pb-16 md:pb-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] tracking-widest-editorial uppercase mb-2">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight mb-10">
              THREE STEPS TO LIVE LINKS
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 130}>
                  <div className="group h-full bg-white dark:bg-[#141619] border border-[#E0E0E0] dark:border-[#26292E] p-7 hover:-translate-y-1 hover:shadow-lg hover:border-[#111111] dark:hover:border-[#10B981] transition-all duration-300">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-4xl font-black font-mono text-[#E0E0E0] dark:text-[#26292E] group-hover:text-[#0B6B4F] dark:group-hover:text-[#10B981] transition-colors">
                        0{i + 1}
                      </span>
                      <Icon className="w-6 h-6 text-[#0B6B4F] dark:text-[#10B981] transform group-hover:scale-110 group-hover:-rotate-6 transition-transform" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight mb-2">
                      {step.title}
                    </h3>
                    <div className="w-8 h-0.5 bg-[#0B6B4F] dark:bg-[#10B981] mb-3 group-hover:w-16 transition-all duration-300" />
                    <p className="text-sm text-[#555555] dark:text-[#9CA3AF] leading-relaxed">{step.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES ─────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] dark:bg-[#0C0D0E] pb-16 md:pb-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#E0E0E0] dark:bg-[#26292E] border border-[#E0E0E0] dark:border-[#26292E]">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i * 90} className="bg-white dark:bg-[#141619]">
                  <div className="group p-6 h-full hover:bg-[#F7F7F7] dark:hover:bg-[#1A1D21] transition-colors">
                    <Icon className="w-5 h-5 text-[#0B6B4F] dark:text-[#10B981] mb-4 transform group-hover:-translate-y-1 transition-transform" />
                    <h3 className="text-sm font-extrabold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-wider mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-[#666666] dark:text-[#9CA3AF] leading-relaxed">{feature.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. CREATOR ──────────────────────────────────────────────────── */}
      <CreatorSection />

      {/* ── 7. CLOSING CTA (same two actions) ───────────────────────────── */}
      <section className="relative overflow-hidden bg-[#111111] dark:bg-[#0C0D0E] py-16 md:py-20">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[36rem] h-64 rounded-full bg-[#10B981]/20 blur-3xl animate-float-slow"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-3">
              START BUILDING <span className="text-[#10B981]">AUTHORITY</span> TODAY
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-8">Free to start. No credit card. No spam.</p>
          </Reveal>
          <Reveal delay={150} className="flex justify-center">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={primaryCta.onClick}
                className="group inline-flex items-center justify-center space-x-2 bg-[#10B981] hover:bg-[#34D399] text-[#0C0D0E] px-7 py-4 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
              >
                <span>{primaryCta.label}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={onExplore}
                className="group inline-flex items-center justify-center space-x-2 border border-white/40 hover:bg-white hover:text-[#111111] text-white px-7 py-4 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
              >
                <span>Explore Backlinks</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
