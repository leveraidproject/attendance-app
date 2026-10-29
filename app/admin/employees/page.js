'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtDate, fmtTime } from '@/lib/time';

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const isAdmin = profile?.role === 'admin';

  // Non-admins go back to their own page.
  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  const load = useCallback(async () => {
    setError('');
    const { data, error } = await supabase.rpc('admin_users');
    if (error) setError(error.message);
    else setPeople(data || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function changeRole(person) {
    const newRole = person.role === 'admin' ? 'employee' : 'admin';
    const who = person.full_name || person.email;
    const message =
      newRole === 'admin'
        ? `Make ${who} an admin? They will be able to see and change everyone's records.`
        : `Remove admin access from ${who}?`;
    if (!window.confirm(message)) return;

    setBusyId(person.id);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', person.id)
      .select();
    setBusyId(null);
    if (error) setError(error.message);
    else if (!data || data.length === 0) setError('The change was not saved. Check that you are logged in as an admin.');
    else load();
  }

  if (loading || !isAdmin) return <p className="p-8 text-sm text-ink/60">Loading…</p>;

  return (
    <Shell profile={profile} user={user} active="employees">
      <h1 className="text-2xl font-semibold">Employees</h1>
      <p className="mt-1 text-sm text-ink/60">Everyone who has an account, and when they last logged in.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!fetching && people.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/60">
                  No accounts yet.
                </td>
              </tr>
            )}
            {people.map((p) => {
              const isMe = p.id === user?.id;
              return (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {p.full_name || '—'}
                      {isMe && <span className="ml-2 text-xs font-normal text-ink/50">(you)</span>}
                    </div>
                    <div className="text-xs text-ink/60">{p.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.role === 'admin' ? 'bg-brand/10 text-brand' : 'bg-ink/5 text-ink/70'
                      }`}
                    >
                      {p.role === 'admin' ? 'Admin' : 'Employee'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.last_sign_in_at ? (
                      <>
                        <div>{fmtDate(p.last_sign_in_at)}</div>
                        <div className="text-xs text-ink/60">{fmtTime(p.last_sign_in_at)}</div>
                      </>
                    ) : (
                      'Never'
                    )}
                  </td>
                  <td className="px-4 py-3">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      <span className="text-xs text-ink/40">—</span>
                    ) : (
                      <button
                        onClick={() => changeRole(p)}
                        disabled={busyId === p.id}
                        className="font-medium text-brand hover:underline disabled:opacity-40"
                      >
                        {p.role === 'admin' ? 'Make employee' : 'Make admin'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
