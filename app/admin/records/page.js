'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Shell from '@/components/Shell';
import { fmtDate, fmtTime, hoursBetween, manilaDateString } from '@/lib/time';

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

// Philippine time is always 8 hours ahead of UTC (no daylight saving).
function toLocalInput(iso) {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 8 * 36e5).toISOString().slice(0, 16);
}

function fromLocalInput(value) {
  return value ? new Date(`${value}:00+08:00`).toISOString() : null;
}

export default function AdminRecordsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [from, setFrom] = useState(manilaDateString(new Date(Date.now() - 6 * 864e5)));
  const [to, setTo] = useState(manilaDateString());
  const [employeeId, setEmployeeId] = useState('');
  const [people, setPeople] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Non-admins go back to their own page.
  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [loading, isAdmin, router]);

  // The list of employees for the filter.
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true })
      .then(({ data }) => setPeople(data || []));
  }, [isAdmin]);

  const loadRows = useCallback(async () => {
    setFetching(true);
    setError('');
    let query = supabase
      .from('time_logs')
      .select('*, profiles(full_name, email)')
      .gte('work_date', from)
      .lte('work_date', to)
      .order('time_in', { ascending: false });
    if (employeeId) query = query.eq('user_id', employeeId);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setRows(data || []);
    setFetching(false);
  }, [from, to, employeeId]);

  useEffect(() => {
    if (isAdmin) loadRows();
  }, [isAdmin, loadRows]);

  function startEdit(row) {
    setError('');
    setEditingId(row.id);
    setEditIn(toLocalInput(row.time_in));
    setEditOut(toLocalInput(row.time_out));
  }

  async function saveEdit() {
    if (!editIn) {
      setError('Time in cannot be empty.');
      return;
    }
    const newIn = fromLocalInput(editIn);
    const newOut = fromLocalInput(editOut);
    if (newOut && new Date(newOut) <= new Date(newIn)) {
      setError('Time out must be after time in.');
      return;
    }
    setSaving(true);
    setError('');
    const { data, error } = await supabase
      .from('time_logs')
      .update({ time_in: newIn, time_out: newOut })
      .eq('id', editingId)
      .select();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data || data.length === 0) {
      setError('The change was not saved. Check that you are logged in as an admin.');
      return;
    }
    setEditingId(null);
    loadRows();
  }

  async function deleteRow(row) {
    const who = row.profiles?.full_name || row.profiles?.email || 'this employee';
    if (!window.confirm(`Delete the record of ${who} on ${fmtDate(row.time_in)}? This cannot be undone.`)) {
      return;
    }
    setError('');
    const { data, error } = await supabase.from('time_logs').delete().eq('id', row.id).select();
    if (error) setError(error.message);
    else if (!data || data.length === 0) setError('The record was not deleted. Check that you are logged in as an admin.');
    else loadRows();
  }

  function downloadCsv() {
    const header = ['Name', 'Email', 'Date', 'Time in', 'Time out', 'Hours'];
    const lines = rows.map((r) =>
      [
        r.profiles?.full_name,
        r.profiles?.email,
        r.work_date,
        fmtTime(r.time_in),
        fmtTime(r.time_out),
        r.time_out ? hoursBetween(r.time_in, r.time_out) : '',
      ]
        .map(csvCell)
        .join(',')
    );
    const csv = '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${from}_to_${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !isAdmin) return <p className="p-8 text-sm text-ink/60">Loading…</p>;

  const inputClass =
    'mt-1 rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

  return (
    <Shell profile={profile} user={user} active="records">
      <h1 className="text-2xl font-semibold">Records</h1>

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium">
          From
          <input type="date" className={`${inputClass} block`} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-sm font-medium">
          To
          <input type="date" className={`${inputClass} block`} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="text-sm font-medium">
          Employee
          <select className={`${inputClass} block`} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All employees</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-40"
        >
          Download CSV
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time in</th>
              <th className="px-4 py-3 font-medium">Time out</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!fetching && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/60">
                  No records in this date range.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const editing = editingId === r.id;
              return (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.profiles?.full_name || '—'}</div>
                    <div className="text-xs text-ink/60">{r.profiles?.email}</div>
                  </td>
                  <td className="px-4 py-3">{fmtDate(r.time_in)}</td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <input
                        type="datetime-local"
                        className={inputClass}
                        value={editIn}
                        onChange={(e) => setEditIn(e.target.value)}
                      />
                    ) : (
                      fmtTime(r.time_in)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <input
                        type="datetime-local"
                        className={inputClass}
                        value={editOut}
                        onChange={(e) => setEditOut(e.target.value)}
                      />
                    ) : (
                      fmtTime(r.time_out)
                    )}
                  </td>
                  <td className="px-4 py-3">{r.time_out ? hoursBetween(r.time_in, r.time_out) : 'Running'}</td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <div className="flex gap-3">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="font-medium text-brand hover:underline disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="font-medium text-ink/60 hover:underline">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button onClick={() => startEdit(r)} className="font-medium text-brand hover:underline">
                          Edit
                        </button>
                        <button onClick={() => deleteRow(r)} className="font-medium text-red-700 hover:underline">
                          Delete
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
    </Shell>
  );
}
