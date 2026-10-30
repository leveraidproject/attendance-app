'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtTime } from '@/lib/time';
import { dayKey, weekStartKey, logHours, sumHours, formatHours } from '@/lib/stats';

function StatCard({ label, value, tint }) {
  return (
    <div className={`rounded-3xl p-6 ${tint}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-ink/70">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [people, setPeople] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);
  const [openLogs, setOpenLogs] = useState([]);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  // Non-admins go back to their own page.
  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  const load = useCallback(async () => {
    setError('');
    const [profilesRes, week, open] = await Promise.all([
      supabase.from('profiles').select('id, status'),
      supabase.from('time_logs').select('*').gte('work_date', weekStartKey()),
      supabase
        .from('time_logs')
        .select('*, profiles(full_name, email)')
        .is('time_out', null)
        .order('time_in', { ascending: true }),
    ]);
    const firstError = profilesRes.error || week.error || open.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }
    setPeople(profilesRes.data || []);
    setWeekLogs(week.data || []);
    setOpenLogs(open.data || []);
    setNow(new Date());
  }, []);

  // Load now, then refresh every 30 seconds.
  useEffect(() => {
    if (!isAdmin) return;
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [isAdmin, load]);

  if (loading || !isAdmin) return <p className="p-8 text-sm text-ink/60">Loading…</p>;

  const today = dayKey(now);
  const todayHours = sumHours(weekLogs.filter((l) => l.work_date === today), now);
  const weekHours = sumHours(weekLogs, now);
  const approvedCount = people.filter((p) => (p.status ?? 'approved') === 'approved').length;
  const pendingCount = people.filter((p) => p.status === 'pending').length;

  return (
    <Shell profile={profile} user={user} active="overview">
      <h1 className="text-3xl font-extrabold">Overview</h1>

      {pendingCount > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-tealtint p-5">
          <p className="font-bold text-ink">
            {pendingCount} {pendingCount === 1 ? 'account is' : 'accounts are'} waiting for your approval.
          </p>
          <Link
            href="/admin/employees"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Review now
          </Link>
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={approvedCount} tint="bg-tealtint" />
        <StatCard label="Timed in now" value={openLogs.length} tint="bg-bluetint" />
        <StatCard label="Hours today" value={formatHours(todayHours)} tint="bg-peachtint" />
        <StatCard label="Hours this week" value={formatHours(weekHours)} tint="bg-white" />
      </div>

      <h2 className="mt-10 px-1 text-2xl font-extrabold">Working right now</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-ink/60">
              <th className="px-6 py-2 font-bold">Employee</th>
              <th className="px-6 py-2 font-bold">Timed in at</th>
              <th className="px-6 py-2 font-bold">Time so far</th>
            </tr>
          </thead>
          <tbody>
            {openLogs.length === 0 && (
              <tr>
                <td colSpan={3} className="rounded-2xl bg-white px-6 py-8 text-center text-ink/60">
                  Nobody is timed in right now.
                </td>
              </tr>
            )}
            {openLogs.map((log) => (
              <tr key={log.id}>
                <td className="rounded-l-2xl bg-white px-6 py-4">
                  <div className="font-bold">{log.profiles?.full_name || '—'}</div>
                  <div className="text-xs text-ink/60">{log.profiles?.email}</div>
                </td>
                <td className="bg-white px-6 py-4">{fmtTime(log.time_in)}</td>
                <td className="rounded-r-2xl bg-white px-6 py-4">
                  <span className="rounded-full bg-tealtint px-3.5 py-1 text-xs font-extrabold tabular-nums text-[#0B4A55]">
                    {formatHours(logHours(log, now))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 px-1 text-xs text-ink/50">This page refreshes by itself every 30 seconds.</p>
    </Shell>
  );
}
