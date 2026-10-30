'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtClock, fmtDate, fmtDateLong, fmtTime, hoursBetween } from '@/lib/time';
import { dayKey, weekStartKey, monthStartKey, sumHours, formatHours } from '@/lib/stats';

function friendlyError(message) {
  if (message.includes('duplicate key') || message.includes('one_open_log')) {
    return 'You are already timed in.';
  }
  if (message.includes('No open time-in')) {
    return 'You have not timed in yet.';
  }
  return message;
}

function StatCard({ label, value, tint }) {
  return (
    <div className={`rounded-3xl p-6 ${tint}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-ink/70">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [now, setNow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Live clock
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('time_in', { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setLogs(data || []);
  }, [user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const openLog = logs.find((l) => !l.time_out);

  async function run(functionName) {
    setBusy(true);
    setError('');
    const { error } = await supabase.rpc(functionName);
    if (error) setError(friendlyError(error.message));
    await loadLogs();
    setBusy(false);
  }

  if (loading) return <p className="p-8 text-sm text-ink/60">Loading…</p>;

  // Hour totals. A running (not yet timed out) record counts up to now.
  const current = now || new Date();
  const today = dayKey(current);
  const weekStart = weekStartKey(current);
  const monthStart = monthStartKey(current);
  const todayHours = sumHours(logs.filter((l) => l.work_date === today), current);
  const weekHours = sumHours(logs.filter((l) => l.work_date >= weekStart), current);
  const monthHours = sumHours(logs.filter((l) => l.work_date >= monthStart), current);

  return (
    <Shell profile={profile} user={user} active="dashboard">
      <section
        aria-label="Clock"
        className="flex flex-wrap items-center justify-between gap-8 rounded-[2rem] bg-gradient-to-r from-ink to-brand p-8 text-white sm:p-12"
      >
        <div>
          <p className="text-base font-semibold text-white/80">{now ? fmtDateLong(now) : ' '}</p>
          <p className="mt-2 text-5xl font-extrabold tabular-nums leading-tight sm:text-7xl">
            {now ? fmtClock(now) : '--:--:--'}
          </p>
          <p className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                openLog ? 'bg-green-300' : 'bg-white/50'
              }`}
            />
            {openLog ? `Timed in since ${fmtTime(openLog.time_in)}` : 'Not timed in'}
          </p>
        </div>

        <div className="grid w-full gap-3 sm:w-[300px]">
          <button
            onClick={() => run('clock_in')}
            disabled={busy || Boolean(openLog)}
            className="h-16 rounded-full border-2 border-white/60 text-xl font-extrabold tracking-wide text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            TIME IN
          </button>
          <button
            onClick={() => run('clock_out')}
            disabled={busy || !openLog}
            className="h-16 rounded-full bg-[#FF9A5C] text-xl font-extrabold tracking-wide text-ink hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            TIME OUT
          </button>
        </div>

        {error && (
          <p className="w-full rounded-2xl bg-red-100 p-3 text-sm font-semibold text-red-900">{error}</p>
        )}
      </section>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Today" value={formatHours(todayHours)} tint="bg-tealtint" />
        <StatCard label="This week" value={formatHours(weekHours)} tint="bg-bluetint" />
        <StatCard label="This month" value={formatHours(monthHours)} tint="bg-peachtint" />
      </div>

      <h2 className="mt-10 px-1 text-2xl font-extrabold">My records</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-ink/60">
              <th className="px-6 py-2 font-bold">Date</th>
              <th className="px-6 py-2 font-bold">Time in</th>
              <th className="px-6 py-2 font-bold">Time out</th>
              <th className="px-6 py-2 font-bold">Hours</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="rounded-2xl bg-white px-6 py-8 text-center text-ink/60">
                  No records yet. Press Time in to start your first one.
                </td>
              </tr>
            )}
            {logs.slice(0, 60).map((log) => (
              <tr key={log.id}>
                <td className="rounded-l-2xl bg-white px-6 py-4 font-bold">{fmtDate(log.time_in)}</td>
                <td className="bg-white px-6 py-4">{fmtTime(log.time_in)}</td>
                <td className="bg-white px-6 py-4">{fmtTime(log.time_out)}</td>
                <td className="rounded-r-2xl bg-white px-6 py-4 font-semibold tabular-nums">
                  {log.time_out ? (
                    hoursBetween(log.time_in, log.time_out)
                  ) : (
                    <span className="rounded-full bg-tealtint px-3.5 py-1 text-xs font-extrabold text-[#0B4A55]">
                      Running
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
