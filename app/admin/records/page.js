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
    'rounded-xl border border-ink/15 bg-mist px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';
  const labelClass = 'text-xs font-bold uppercase tracking-widest text-ink/70';

  return (
    <Shell profile={profile} user={user} active="records">
      <h1 className="text-3xl font-extrabold">Records</h1>

      <div className="mt-5 flex flex-wrap items-end gap-4 rounded-3xl bg-white p-5">
        <label className={labelClass}>
          From
          <input
            type="date"
            className={`${inputClass} mt-1 block font-medium normal-case tracking-normal`}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          To
          <input
            type="date"
            className={`${inputClass} mt-1 block font-medium normal-case tracking-normal`}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className={labelClass}>
          Employee
          <select
            className={`${inputClass} mt-1 block font-medium normal-case tracking-normal`}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
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
          className="min-h-[44px] rounded-full bg-ink px-6 text-sm font-bold text-white hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40"
        >
          Download CSV
        </button>
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-ink/60">
              <th className="px-5 py-2 font-bold">Employee</th>
              <th className="px-5 py-2 font-bold">Date</th>
              <th className="px-5 py-2 font-bold">Time in</th>
              <th className="px-5 py-2 font-bold">Time out</th>
              <th className="px-5 py-2 font-bold">Hours</th>
              <th className="px-5 py-2 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!fetching && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="rounded-2xl bg-white px-5 py-8 text-center text-ink/60">
                  No records in this date range.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const editing = editingId === r.id;
              return (
                <tr key={r.id}>
                  <td className="rounded-l-2xl bg-white px-5 py-4">
                    <div className="font-bold">{r.profiles?.full_name || '—'}</div>
                    <div className="text-xs text-ink/60">{r.profiles?.email}</div>
                  </td>
                  <td className="bg-white px-5 py-4">{fmtDate(r.time_in)}</td>
                  <td className="bg-white px-5 py-4">
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
                  <td className="bg-white px-5 py-4">
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
                  <td className="bg-white px-5 py-4 font-semibold tabular-nums">
                    {r.time_out ? (
                      hoursBetween(r.time_in, r.time_out)
                    ) : (
                      <span className="rounded-full bg-tealtint px-3.5 py-1 text-xs font-extrabold text-[#0B4A55]">
                        Running
                      </span>
                    )}
                  </td>
                  <td className="rounded-r-2xl bg-white px-5 py-4">
                    {editing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-3 py-1.5 text-xs font-bold text-ink/70 hover:bg-mist"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(r)}
                          className="rounded-full bg-tealtint px-4 py-1.5 text-xs font-bold text-ink hover:brightness-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRow(r)}
                          className="rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold text-red-800 hover:brightness-95"
                        >
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
