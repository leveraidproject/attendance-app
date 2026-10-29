'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { COMPANY_NAME } from '@/lib/config';

export default function Shell({ profile, user, active, children }) {
  const router = useRouter();
  const name = profile?.full_name || user?.email || '';
  const isAdmin = profile?.role === 'admin';

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const linkClass = (key) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
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
                <>
                  <Link href="/admin" className={linkClass('overview')}>
                    Overview
                  </Link>
                  <Link href="/admin/records" className={linkClass('records')}>
                    Records
                  </Link>
                  <Link href="/admin/employees" className={linkClass('employees')}>
                    Employees
                  </Link>
                </>
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
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
