'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtDate, fmtTime } from '@/lib/time';

const badgeClass = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
const badgeText = { pending: 'Pending', approved: 'Approved', rejected: 'Declined' };

function lastLogin(iso) {
  if (!iso) return 'Never';
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const isAdmin = profile?.role === 'admin';

  // Employees cannot open this page.
  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_users');
    if (error) {
      setError(error.message);
    } else {
      setError('');
      setPeople(data || []);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function run(personId, functionName, args) {
    setBusyId(personId);
    setError('');
    const { error } = await supabase.rpc(functionName, args);
    if (error) setError(error.message);
    await load();
    setBusyId(null);
  }

  const setStatus = (id, status) =>
    run(id, 'admin_set_status', { target: id, new_status: status });
  const setRole = (id, role) => run(id, 'admin_set_role', { target: id, new_role: role });

  if (loading || !isAdmin) return <p className="p-8 text-sm text-ink/60">Loading…</p>;

  const pending = people.filter((p) => p.status === 'pending');
  const buttonBase =
    'rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50';

  return (
    <Shell profile={profile} user={user} active="approvals">
      <h1 className="text-2xl font-semibold">Account approvals</h1>
      <p className="mt-1 text-sm text-ink/60">
        New accounts must be approved here before they can time in or out.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Waiting for approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/60">
            No one is waiting right now.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4"
              >
                <div>
                  <div className="font-medium">{p.full_name || 'No name'}</div>
                  <div className="text-sm text-ink/60">{p.email}</div>
                  <div className="text-xs text-ink/50">Signed up {fmtDate(p.created_at)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(p.id, 'approved')}
                    disabled={busyId === p.id}
                    className={`${buttonBase} bg-clockin text-white hover:brightness-110`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setStatus(p.id, 'rejected')}
                    disabled={busyId === p.id}
                    className={`${buttonBase} border border-ink/20 text-ink hover:bg-ink/5`}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Everyone ({people.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-ink/60">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const isMe = p.id === user.id;
                return (
                  <tr key={p.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {p.full_name || 'No name'} {isMe && <span className="text-ink/50">(you)</span>}
                      </div>
                      <div className="text-xs text-ink/60">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          badgeClass[p.status] || ''
                        }`}
                      >
                        {badgeText[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{lastLogin(p.last_sign_in_at)}</td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="text-ink/40">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => setStatus(p.id, 'approved')}
                              disabled={busyId === p.id}
                              className={`${buttonBase} bg-clockin text-white hover:brightness-110`}
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Decline ${p.full_name || p.email}?`)) {
                                  setStatus(p.id, 'rejected');
                                }
                              }}
                              disabled={busyId === p.id}
                              className={`${buttonBase} border border-ink/20 hover:bg-ink/5`}
                            >
                              Decline
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const next = p.role === 'admin' ? 'employee' : 'admin';
                              if (window.confirm(`Make ${p.full_name || p.email} an ${next}?`)) {
                                setRole(p.id, next);
                              }
                            }}
                            disabled={busyId === p.id}
                            className={`${buttonBase} border border-ink/20 hover:bg-ink/5`}
                          >
                            {p.role === 'admin' ? 'Make employee' : 'Make admin'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
