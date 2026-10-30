'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isConfigured } from '@/lib/supabase';
import { COMPANY_NAME } from '@/lib/config';

const inputClass =
  'mt-1 w-full rounded-xl border border-ink/15 bg-mist px-4 py-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';
const labelClass = 'block text-sm font-bold';

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

function PasswordField({ id, label, value, onChange, autoComplete, show, onToggle }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`${inputClass} pr-12`}
          value={value}
          onChange={onChange}
          required
          minLength={6}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink/60 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSignup = mode === 'signup';
  const hasConfirm = confirmPassword.length > 0;
  const mismatch = isSignup && hasConfirm && password !== confirmPassword;
  const matches = isSignup && hasConfirm && password === confirmPassword;

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

    // Stop here if the two passwords are not the same.
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match. Please type the same password in both boxes.');
      return;
    }

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
      setNotice(
        'Account created. Check your email and click the confirmation link. An admin must also approve your account before you can use it.'
      );
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col justify-between bg-gradient-to-br from-ink to-brand p-8 text-white lg:p-14">
        <div className="inline-flex w-fit rounded-3xl bg-white p-4 shadow-sm">
          <img src="/logo-full.png" alt={COMPANY_NAME} className="h-24 w-auto lg:h-32" />
        </div>
        <div className="py-12">
          <h1 className="text-4xl font-extrabold leading-tight lg:text-5xl">
            Start your shift.
            <br />
            End it. We keep the record.
          </h1>
          <p className="mt-4 max-w-sm text-lg text-white/80">
            Log in to time in and time out. Your hours are saved automatically.
          </p>
        </div>
        <p className="text-sm font-medium text-white/70">Times shown in Philippine time</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-extrabold">{isSignup ? 'Create your account' : 'Log in'}</h2>
          <p className="mt-1 text-sm text-ink/60">
            {isSignup ? 'An admin will approve your account after you sign up.' : 'Welcome back.'}
          </p>

          {!isConfigured && (
            <p className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm text-amber-900">
              The app is not connected to Supabase yet. Add the two environment settings
              (see README), then redeploy.
            </p>
          )}

          {isSignup && (
            <label className={`mt-6 ${labelClass}`}>
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

          <label className={`mt-4 ${labelClass}`}>
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

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />

          {isSignup && (
            <>
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
              {mismatch && (
                <p className="mt-2 text-sm font-semibold text-red-700" role="alert">
                  Passwords do not match.
                </p>
              )}
              {matches && <p className="mt-2 text-sm font-semibold text-green-700">Passwords match.</p>}
            </>
          )}

          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          {notice && <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-semibold text-green-800">{notice}</p>}

          <button
            type="submit"
            disabled={busy || mismatch}
            className="mt-6 h-14 w-full rounded-full bg-brand px-4 text-base font-extrabold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>

          <p className="mt-5 text-center text-sm text-ink/70">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'signin' : 'signup');
                setConfirmPassword('');
                setError('');
                setNotice('');
              }}
              className="font-bold text-brand hover:underline"
            >
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
