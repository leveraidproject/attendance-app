'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtClock, fmtDate, fmtDateLong, fmtTime, hoursBetween } from '@/lib/time';

function friendlyError(message) {
  if (message.includes('duplicate key') || message.includes('one_open_log')) {
    return 'You are already timed in.';
  }
  if (message.includes('No open time-in')) {
    return 'You have not timed in yet.';
  }
  return message;
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
      .limit(60);
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

  return (
    <Shell profile={profile} user={user} active="dashboard">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl bg-ink p-8 text-white">
          <p className="text-sm text-white/70">{now ? fmtDateLong(now) : ' '}</p>
          <p className="mt-2 text-4xl font-semibold tabular-nums sm:text-5xl">
            {now ? fmtClock(now) : '--:--:--'}
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                openLog ? 'bg-green-400' : 'bg-white/40'
              }`}
            />
            <span>
              {openLog ? `Timed in since ${fmtTime(openLog.time_in)}` : 'Not timed in'}
            </span>
          </div>

          <div className="mt-8 grid gap-3">
            <button
              onClick={() => run('clock_in')}
              disabled={busy || Boolean(openLog)}
              className="rounded-xl bg-clockin px-4 py-4 text-lg font-semibold hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Time in
            </button>
            <button
              onClick={() => run('clock_out')}
              disabled={busy || !openLog}
              className="rounded-xl bg-clockout px-4 py-4 text-lg font-semibold hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Time out
            </button>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-900">{error}</p>}
        </section>

        <section>
          <h2 className="text-xl font-semibold">My records</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-ink/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time in</th>
                  <th className="px-4 py-3 font-medium">Time out</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ink/60">
                      No records yet. Press Time in to start your first one.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{fmtDate(log.time_in)}</td>
                    <td className="px-4 py-3">{fmtTime(log.time_in)}</td>
                    <td className="px-4 py-3">{fmtTime(log.time_out)}</td>
                    <td className="px-4 py-3">
                      {log.time_out ? hoursBetween(log.time_in, log.time_out) : 'Running'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}
