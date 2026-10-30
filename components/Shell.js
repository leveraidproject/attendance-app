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
    `flex items-center gap-2 rounded-full px-5 py-2.5 text-sm ${
      active === key
        ? 'bg-ink font-bold text-white'
        : 'font-semibold text-ink/70 hover:bg-white hover:text-ink'
    }`;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white py-2.5 pl-6 pr-3 shadow-sm lg:rounded-full">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label={COMPANY_NAME}>
            <img src="/logo-mark.png" alt="" className="h-10 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="text-xl font-extrabold tracking-[0.14em] text-ink">
                LEVER<span className="text-brand">AID</span>
              </span>
              <span className="mt-1 text-[8px] font-semibold tracking-[0.5em] text-ink">SOLUTIONS</span>
            </span>
          </Link>

          <nav className="flex flex-wrap gap-1 rounded-full bg-[#F1F6F8] p-1" aria-label="Main">
            <Link href="/dashboard" className={linkClass('dashboard')}>
              My time
            </Link>
            {isAdmin && (
              <Link href="/admin" className={linkClass('overview')}>
                Overview
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/records" className={linkClass('records')}>
                Records
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/employees" className={linkClass('approvals')}>
                Approvals
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-ink/70">{name}</span>
            <button
              onClick={logout}
              className="min-h-[44px] rounded-full bg-tealtint px-5 font-bold text-ink hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Log out
            </button>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {blocked ? (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-extrabold">
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
