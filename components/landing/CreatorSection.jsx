'use client';

import React from 'react';
import { Github, Linkedin, Globe, Mail, Link2, User, MessageSquare } from 'lucide-react';
import { CREATOR, resolveCreatorLink } from '@/lib/creator';
import Reveal from '@/components/landing/Reveal';

const ICONS = {
  github: Github,
  linkedin: Linkedin,
  portfolio: Globe,
  email: Mail,
  whatsapp: MessageSquare,
};

const chipBase =
  'inline-flex items-center space-x-2 px-4 py-2.5 border text-xs font-bold uppercase tracking-wider transition-all duration-200';

export default function CreatorSection() {
  return (
    <section
      id="creator"
      className="w-full bg-white dark:bg-[#141619] border-y border-[#E0E0E0] dark:border-[#26292E] py-16 md:py-24 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-xs font-bold text-[#0B6B4F] dark:text-[#10B981] tracking-widest-editorial uppercase mb-2">
            THE CREATOR
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight mb-10">
            BUILT BY
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* Profile picture */}
          <Reveal className="md:col-span-4 flex justify-center">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 animate-float">
              {/* Rotating gradient ring */}
              <div
                className="absolute inset-0 rounded-full animate-spin-slow"
                style={{
                  background:
                    'conic-gradient(from 0deg, #0B6B4F, transparent 35%, #10B981, transparent 70%, #0B6B4F)',
                }}
                aria-hidden="true"
              />
              <div className="absolute inset-[4px] rounded-full bg-white dark:bg-[#141619] overflow-hidden flex items-center justify-center">
                {CREATOR.avatar ? (
                  <img
                    src={CREATOR.avatar}
                    alt={`${CREATOR.name} — profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-[#888888] dark:text-[#6B7280]">
                    <User className="w-14 h-14 mb-1" strokeWidth={1.25} />
                    <span className="text-[10px] font-bold tracking-widest-editorial uppercase">
                      Add photo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Details + links */}
          <div className="md:col-span-8">
            <Reveal delay={120}>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111111] dark:text-[#F3F4F6] tracking-tight">
                {CREATOR.name}
              </h3>
              <div className="text-sm font-semibold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-wider mt-1">
                {CREATOR.role}
              </div>
              <div className="w-12 h-0.5 bg-[#0B6B4F] dark:bg-[#10B981] my-4" />
              <p className="text-sm sm:text-base text-[#555555] dark:text-[#9CA3AF] leading-relaxed max-w-xl mb-6">
                {CREATOR.bio}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-wrap gap-3">
                {CREATOR.links.map((link) => {
                  const Icon = ICONS[link.id] || Link2;
                  const href = resolveCreatorLink(link);

                  if (!href) {
                    return (
                      <span
                        key={link.id}
                        aria-disabled="true"
                        title="Add this link in lib/creator.js"
                        className={`${chipBase} border-dashed border-[#CCCCCC] dark:border-[#3B4048] text-[#AAAAAA] dark:text-[#6B7280] cursor-not-allowed`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </span>
                    );
                  }

                  return (
                    <a
                      key={link.id}
                      href={href}
                      target={href.startsWith('mailto:') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className={`${chipBase} border-[#111111] dark:border-[#26292E] bg-white dark:bg-[#1A1D21] text-[#111111] dark:text-[#F3F4F6] hover:-translate-y-0.5 hover:bg-[#111111] hover:text-white dark:hover:bg-[#10B981] dark:hover:text-[#0C0D0E] dark:hover:border-[#10B981]`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
