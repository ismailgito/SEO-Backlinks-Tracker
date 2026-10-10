'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, Lock, CheckCircle2, AlertCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loading } from '@/components/Loading';

function toFriendlyError(err, fallback) {
  if (err?.name === 'TypeError') {
    return 'Network error. Check your connection and try again.';
  }
  return err?.message || fallback;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
  limitReachedReason,
}) {
  const [mode, setMode] = useState(initialMode); // 'signin', 'signup', 'otp_verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset modal state whenever it opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setSimulatedOtp('');
      setLoading(false);
      setErrorMsg('');
      setSuccessMsg('');
      setResendCooldown(0);
    }
  }, [isOpen, initialMode]);

  // Cooldown countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const isLiveSupabase = isSupabaseConfigured();

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    if (!isLiveSupabase) {
      const demoUser = {
        id: `google-${Date.now()}`,
        email: 'google-user@example.com',
        name: 'Demo Google User',
        provider: 'google',
      };
      onSuccess(demoUser);
      onClose();
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err.message || 'Google OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOtpCode = async ({ isResend = false, type = 'signup' } = {}) => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (isLiveSupabase) {
        const response = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, type, password }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send verification code');
        }
        if (data.simulated && data.otpCode) {
          setSimulatedOtp(data.otpCode);
          setSuccessMsg(`[DEMO EMAIL] Use code: ${data.otpCode}`);
        } else {
          setSimulatedOtp('');
          setSuccessMsg(
            `${isResend ? 'New code sent' : 'Verification code sent'} to ${email}`
          );
        }
        setOtpCode('');
        setResendCooldown(30);
        setMode('otp_verify');
      } else {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedOtp(code);
        setSuccessMsg(`[DEMO MODE] Use code: ${code}`);
        setOtpCode('');
        setResendCooldown(30);
        setMode('otp_verify');
      }
    } catch (err) {
      setErrorMsg(toFriendlyError(err, 'Failed to send verification code'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password should be at least 8 characters long');
      return;
    }
    await sendOtpCode({ type: 'signup' });
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (isLiveSupabase) {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid email or password');
        }

        onSuccess({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        });
        onClose();
      } else {
        // Offline demo sign in
        const mockUser = {
          id: `usr-${Date.now()}`,
          email,
          name: email.split('@')[0],
        };
        onSuccess(mockUser);
        onClose();
      }
    } catch (err) {
      setErrorMsg(toFriendlyError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    await sendOtpCode({ isResend: true, type: 'signup' });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (isLiveSupabase) {
        const supabase = getSupabaseBrowserClient();
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            code: otpCode,
            password: password,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        if (data.session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          if (sessionError) throw sessionError;
        }

        onSuccess({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        });
        onClose();
      } else {
        if (simulatedOtp && otpCode !== simulatedOtp) {
          setErrorMsg('Invalid verification code. Try again or check the demo code.');
          setLoading(false);
          return;
        }

        const mockUser = {
          id: `usr-${Date.now()}`,
          email,
          name: email.split('@')[0],
        };
        onSuccess(mockUser);
        onClose();
      }
    } catch (err) {
      setErrorMsg(toFriendlyError(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F7F7F7] dark:bg-[#141619] border border-[#111111] dark:border-[#26292E] max-w-md w-full p-6 sm:p-8 shadow-2xl relative transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Limit Reached Notification Banner */}
        {limitReachedReason && (
          <div className="mb-6 p-4 bg-[#E8F3EE] dark:bg-[#10B981]/15 border border-[#0B6B4F] dark:border-[#10B981] text-[#0B6B4F] dark:text-[#10B981]">
            <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-widest-editorial mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Free Tier Limit Reached</span>
            </div>
            <p className="text-xs text-[#111111] dark:text-[#F3F4F6] leading-relaxed">
              {limitReachedReason}
            </p>
          </div>
        )}

        {/* Modal Title */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-[#0B6B4F] dark:text-[#10B981] uppercase tracking-widest-editorial mb-1">
            ACCOUNT ACCESS
          </div>
          <h2 className="text-2xl font-black text-[#111111] dark:text-[#F3F4F6] uppercase tracking-tight">
            {mode === 'otp_verify'
              ? 'ENTER VERIFICATION CODE'
              : mode === 'signup'
              ? 'CREATE ACCOUNT'
              : 'SIGN IN'}
          </h2>
          <p className="text-xs text-[#666666] dark:text-[#9CA3AF] mt-1">
            Unlock unlimited secured backlinks, multi-project tracking, and cloud sync.
          </p>
        </div>

        {/* Mode Tabs */}
        {mode !== 'otp_verify' && (
          <div className="flex border-b border-[#E0E0E0] dark:border-[#26292E] mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`pb-2 text-xs font-bold uppercase tracking-widest-editorial w-1/2 transition-colors ${
                mode === 'signup'
                  ? 'border-b-2 border-[#111111] dark:border-[#10B981] text-[#111111] dark:text-[#F3F4F6]'
                  : 'text-[#888888] dark:text-[#6B7280] hover:text-[#111111] dark:hover:text-[#9CA3AF]'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`pb-2 text-xs font-bold uppercase tracking-widest-editorial w-1/2 transition-colors ${
                mode === 'signin'
                  ? 'border-b-2 border-[#111111] dark:border-[#10B981] text-[#111111] dark:text-[#F3F4F6]'
                  : 'text-[#888888] dark:text-[#6B7280] hover:text-[#111111] dark:hover:text-[#9CA3AF]'
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Mode Indicator / Offline Notice */}
        {!isLiveSupabase && (
          <div className="mb-4 px-3 py-1.5 bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800 text-[#92400E] dark:text-amber-300 text-[11px] flex items-center justify-between">
            <span>Running in Demo / Local Storage Mode</span>
            <span className="font-mono text-[10px]">Ready for Supabase</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign Up Flow */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="founder@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold py-3 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
            >
              {loading ? (
                <>
                  <Loading size="sm" color="secondary" />
                  <span>SENDING VERIFICATION...</span>
                </>
              ) : (
                <>
                  <span>SIGN UP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign In Flow */}
        {mode === 'signin' && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="founder@yourdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-sm text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-[#111111] dark:bg-[#10B981] hover:bg-[#0B6B4F] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold py-3 text-xs uppercase tracking-widest-editorial font-bold transition-colors"
            >
              {loading ? (
                <>
                  <Loading size="sm" color="secondary" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* OTP Verify Flow (For Signup) */}
        {mode === 'otp_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F3F4F6] uppercase tracking-widest-editorial mb-1">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#888888] dark:text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white dark:bg-[#1A1D21] border border-[#E0E0E0] dark:border-[#26292E] pl-10 pr-3.5 py-2.5 text-base font-mono tracking-widest text-[#111111] dark:text-[#F3F4F6] placeholder-[#888888] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#0B6B4F] dark:focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#888888] dark:text-[#6B7280] pt-1">
              <span className="truncate">Code sent to {email}</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center space-x-1 font-bold uppercase tracking-wider text-[#0B6B4F] dark:text-[#10B981] hover:underline disabled:text-[#888888] disabled:dark:text-[#6B7280] disabled:no-underline flex-shrink-0 ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="w-1/3 text-xs uppercase tracking-wider font-bold text-[#888888] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#F3F4F6] py-3"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-[#0B6B4F] dark:bg-[#10B981] hover:bg-[#08523C] dark:hover:bg-[#059669] text-white dark:text-[#0C0D0E] dark:font-extrabold py-3 text-xs uppercase tracking-widest-editorial font-bold transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loading size="sm" color="secondary" />
                    <span>VERIFYING...</span>
                  </>
                ) : (
                  <span>VERIFY &amp; SIGN IN</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Google OAuth Button */}
        {mode !== 'otp_verify' && (
          <div className="mt-6">
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E0E0E0] dark:border-[#26292E]"></div>
              </div>
              <span className="relative bg-[#F7F7F7] dark:bg-[#141619] px-3 text-[11px] text-[#888888] dark:text-[#9CA3AF] font-bold tracking-widest-editorial uppercase">
                OR
              </span>
            </div>
            
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-[#1A1D21] hover:bg-[#F0F0F0] dark:hover:bg-[#22262B] text-[#111111] dark:text-[#F3F4F6] border border-[#E0E0E0] dark:border-[#26292E] hover:border-[#111111] dark:hover:border-[#10B981] py-3 text-xs uppercase tracking-widest-editorial font-bold transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
