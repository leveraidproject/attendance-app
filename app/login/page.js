'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';
import { COMPANY_NAME } from '@/lib/config';

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // If already logged in, skip this page.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.replace('/dashboard');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (data.session) {
      router.replace('/dashboard');
    } else {
      setNotice('Account created. Check your email and click the confirmation link, then log in.');
      setMode('signin');
      setBusy(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col justify-between bg-ink p-8 text-white lg:p-14">
        <p className="text-lg font-semibold">{COMPANY_NAME}</p>
        <div className="py-12">
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
            Start your shift.
            <br />
            End it. We keep the record.
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Log in to time in and time out. Your hours are saved automatically.
          </p>
        </div>
        <p className="text-sm text-white/50">Times shown in Philippine time</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">
            {mode === 'signin' ? 'Log in' : 'Create your account'}
          </h2>

          {!isConfigured && (
            <p className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
              The app is not connected to Supabase yet. Add the two environment settings
              (see README), then redeploy.
            </p>
          )}

          {mode === 'signup' && (
            <label className="mt-6 block text-sm font-medium">
              Full name
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="mt-4 block text-sm font-medium">
            Email
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <div className="mt-4">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-12`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink/60 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white hover:bg-brand/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
          </button>

          <p className="mt-5 text-center text-sm text-ink/70">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setNotice('');
              }}
              className="font-semibold text-brand hover:underline"
            >
              {mode === 'signin' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
