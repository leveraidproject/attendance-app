'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { COMPANY_NAME } from '@/lib/config';

export default function Shell({ profile, user, active, children }) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const name = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === 'admin';
  const status = profile?.status ?? 'approved';
  const blocked = !isAdmin && status !== 'approved';

  // Admins see how many accounts are waiting.
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0));
  }, [isAdmin, active]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const linkClass = (key) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
      active === key ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
    }`;

  return (
    <div className="min-h-screen">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-lg font-semibold">{COMPANY_NAME}</span>
            <nav className="flex flex-wrap gap-1">
              <Link href="/dashboard" className={linkClass('dashboard')}>
                My time
              </Link>
              {isAdmin && (
                <Link href="/admin" className={linkClass('admin')}>
                  Admin
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/employees" className={linkClass('approvals')}>
                  Approvals
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-ink">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/70">{name}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-white/30 px-3 py-1.5 font-medium hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        {blocked ? (
          <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center">
            <h1 className="text-xl font-semibold">
              {status === 'rejected' ? 'Your account was declined' : 'Waiting for approval'}
            </h1>
            <p className="mt-3 text-ink/70">
              {status === 'rejected'
                ? 'An admin declined this account. Please contact your admin if you think this is a mistake.'
                : 'Your account was created. An admin needs to approve it before you can time in or out. Please check back later.'}
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
