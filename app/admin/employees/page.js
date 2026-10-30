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
    'rounded-full px-4 py-1.5 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50';
  const approveClass = `${buttonBase} bg-clockin text-white hover:brightness-110`;
  const declineClass = `${buttonBase} bg-red-100 text-red-800 hover:brightness-95`;
  const roleClass = `${buttonBase} bg-tealtint text-ink hover:brightness-95`;

  return (
    <Shell profile={profile} user={user} active="approvals">
      <h1 className="text-3xl font-extrabold">Account approvals</h1>
      <p className="mt-1 text-sm text-ink/60">
        New accounts must be approved here before they can time in or out.
      </p>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

      <section className="mt-6">
        <h2 className="flex items-center gap-2 px-1 text-xl font-extrabold">
          Waiting for approval
          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-bold text-ink">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-3xl bg-white p-6 text-sm text-ink/60">No one is waiting right now.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 ring-2 ring-amber-300"
              >
                <div>
                  <div className="font-bold">{p.full_name || 'No name'}</div>
                  <div className="text-sm text-ink/60">{p.email}</div>
                  <div className="text-xs text-ink/50">Signed up {fmtDate(p.created_at)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus(p.id, 'approved')}
                    disabled={busyId === p.id}
                    className={approveClass}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setStatus(p.id, 'rejected')}
                    disabled={busyId === p.id}
                    className={declineClass}
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
        <h2 className="px-1 text-xl font-extrabold">Everyone ({people.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-ink/60">
                <th className="px-5 py-2 font-bold">Person</th>
                <th className="px-5 py-2 font-bold">Role</th>
                <th className="px-5 py-2 font-bold">Status</th>
                <th className="px-5 py-2 font-bold">Last login</th>
                <th className="px-5 py-2 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const isMe = p.id === user.id;
                return (
                  <tr key={p.id}>
                    <td className="rounded-l-2xl bg-white px-5 py-4">
                      <div className="font-bold">
                        {p.full_name || 'No name'} {isMe && <span className="font-medium text-ink/50">(you)</span>}
                      </div>
                      <div className="text-xs text-ink/60">{p.email}</div>
                    </td>
                    <td className="bg-white px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          p.role === 'admin' ? 'bg-ink text-white' : 'bg-mist text-ink'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="bg-white px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass[p.status] || ''}`}
                      >
                        {badgeText[p.status] || p.status}
                      </span>
                    </td>
                    <td className="bg-white px-5 py-4">{lastLogin(p.last_sign_in_at)}</td>
                    <td className="rounded-r-2xl bg-white px-5 py-4">
                      {isMe ? (
                        <span className="text-ink/40">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => setStatus(p.id, 'approved')}
                              disabled={busyId === p.id}
                              className={approveClass}
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
                              className={declineClass}
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
                            className={roleClass}
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
