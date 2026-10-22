'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';
import { COMPANY_NAME } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

          <label className="mt-4 block text-sm font-medium">
            Password
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

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
