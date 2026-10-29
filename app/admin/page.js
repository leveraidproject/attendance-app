'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtTime } from '@/lib/time';
import { dayKey, weekStartKey, logHours, sumHours, formatHours } from '@/lib/stats';

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [employees, setEmployees] = useState([]);
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
    const [people, week, open] = await Promise.all([
      supabase.from('profiles').select('id'),
      supabase.from('time_logs').select('*').gte('work_date', weekStartKey()),
      supabase
        .from('time_logs')
        .select('*, profiles(full_name, email)')
        .is('time_out', null)
        .order('time_in', { ascending: true }),
    ]);
    const firstError = people.error || week.error || open.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }
    setEmployees(people.data || []);
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

  return (
    <Shell profile={profile} user={user} active="overview">
      <h1 className="text-2xl font-semibold">Overview</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employees" value={employees.length} />
        <StatCard label="Timed in right now" value={openLogs.length} />
        <StatCard label="Hours today" value={formatHours(todayHours)} />
        <StatCard label="Hours this week" value={formatHours(weekHours)} />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Working right now</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Timed in at</th>
              <th className="px-4 py-3 font-medium">Time so far</th>
            </tr>
          </thead>
          <tbody>
            {openLogs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink/60">
                  Nobody is timed in right now.
                </td>
              </tr>
            )}
            {openLogs.map((log) => (
              <tr key={log.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{log.profiles?.full_name || '—'}</div>
                  <div className="text-xs text-ink/60">{log.profiles?.email}</div>
                </td>
                <td className="px-4 py-3">{fmtTime(log.time_in)}</td>
                <td className="px-4 py-3">{formatHours(logHours(log, now))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink/50">This page refreshes by itself every 30 seconds.</p>
    </Shell>
  );
}
