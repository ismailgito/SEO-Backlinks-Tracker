'use client';

import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, MailWarning, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loading } from '@/components/Loading';

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  'w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-10 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]';
const labelClass =
  'block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1';
const primaryButtonClass =
  'w-full flex items-center justify-center space-x-2 bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold py-3 text-xs uppercase tracking-widest-editorial font-bold transition-colors disabled:opacity-60';

export default function ResetPasswordPage() {
  // 'checking' | 'ready' | 'invalid' | 'success'
  const [status, setStatus] = useState('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Apply the saved theme (same logic as the main page)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('seo_theme');
      const prefersDark =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = (savedTheme || (prefersDark ? 'dark' : 'light')) === 'dark';
      document.documentElement.classList.toggle('dark', dark);
    } catch {
      // Theme is cosmetic; ignore storage errors
    }
  }, []);

  // The /auth/confirm route verified the email link and set a session cookie.
  // No session here means the link was invalid, expired, or already used.
  useEffect(() => {
    // A failed/expired link redirects here with ?error=... Don't fall through
    // to "ready" just because the visitor happens to be signed in already:
    // that would let them change their own password from a dead link.
    const linkFailed = new URLSearchParams(window.location.search).has('error');
    if (linkFailed || !isSupabaseConfigured()) {
      setStatus('invalid');
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'ready' : 'invalid');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Password should be at least ${MIN_PASSWORD_LENGTH} characters long`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (error.code === 'same_password') {
          throw new Error('New password must be different from your old password');
        }
        if (error.code === 'weak_password') {
          throw new Error(error.message || 'Please choose a stronger password');
        }
        throw error;
      }

      // Best effort: sign out every other device that still holds an old session.
      try {
        await supabase.auth.signOut({ scope: 'others' });
      } catch {
        // Password is already changed; not critical
      }

      setNewPassword('');
      setConfirmPassword('');
      setStatus('success');
    } catch (err) {
      setErrorMsg(
        err?.name === 'TypeError'
          ? 'Network error. Check your connection and try again.'
          : err?.message || 'Could not update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (
    <button
      type="button"
      onClick={() => setShowPasswords((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] transition-colors"
      aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
    >
      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7] dark:bg-[#0C0D0E] transition-colors duration-200">
      {/* Top bar with the stylized logo */}
      <header className="w-full bg-[#F7F7F7] dark:bg-[#141619] border-b border-[#E0E0E0] dark:border-[#26292E] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <a href="/" className="group flex items-center space-x-1" aria-label="Back to SEO / BL">
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
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#F7F7F7] dark:bg-[#141619] border border-[#111111] dark:border-[#26292E] max-w-md w-full p-6 sm:p-8 shadow-2xl transition-colors">
          {status === 'checking' && (
            <div className="py-10 flex flex-col items-center space-y-3">
              <Loading size="lg" />
              <span className="text-xs text-[#888888] dark:text-[#9CA3AF] uppercase tracking-widest-editorial font-bold">
                Verifying link...
              </span>
            </div>
          )}

          {status === 'invalid' && (
            <div>
              <div className="text-[11px] font-bold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest-editorial mb-1">
                LINK PROBLEM
              </div>
              <h1 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
                LINK EXPIRED OR INVALID
              </h1>
              <div className="my-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2">
                <MailWarning className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  This password reset link is invalid, has expired, or was already used. Reset links
                  work once and expire after 1 hour.
                </span>
              </div>
              <a href="/?forgot=1" className={primaryButtonClass}>
                <span>REQUEST A NEW LINK</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-2">
                <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
                  ACCOUNT ACCESS
                </div>
                <h1 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
                  CREATE NEW PASSWORD
                </h1>
                <p className="text-xs text-[#666666] dark:text-[#9CA3AF] mt-1">
                  Choose a new password for your account. Minimum {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="new-password" className={labelClass}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                  />
                  {toggleVisibility}
                </div>
              </div>

              <div>
                <label htmlFor="confirm-new-password" className={labelClass}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-new-password"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className={primaryButtonClass}>
                {loading ? (
                  <>
                    <Loading size="sm" color="secondary" />
                    <span>UPDATING PASSWORD...</span>
                  </>
                ) : (
                  <>
                    <span>UPDATE PASSWORD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'success' && (
            <div>
              <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
                ALL DONE
              </div>
              <h1 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
                PASSWORD UPDATED
              </h1>
              <div className="my-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your password has been changed and you are signed in. Other devices have been
                  signed out.
                </span>
              </div>
              <a href="/" className={primaryButtonClass}>
                <span>CONTINUE TO DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
