import { TIMEZONE } from './config';

// Today's date as 2026-10-29, in Philippine time.
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);
}

// The Monday of this week, as 2026-10-26.
export function weekStartKey(date = new Date()) {
  const [y, m, d] = dayKey(date).split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  const dow = day.getUTCDay(); // 0 = Sunday
  day.setUTCDate(day.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return day.toISOString().slice(0, 10);
}

// The first day of this month, as 2026-10-01.
export function monthStartKey(date = new Date()) {
  return dayKey(date).slice(0, 8) + '01';
}

// Hours worked for one record. If still timed in, counts up to now.
export function logHours(log, now = new Date()) {
  const end = log.time_out ? new Date(log.time_out) : now;
  const hours = (end - new Date(log.time_in)) / 36e5;
  return hours > 0 ? hours : 0;
}

export function sumHours(logs, now = new Date()) {
  return logs.reduce((total, log) => total + logHours(log, now), 0);
}

// 7.5 becomes "7h 30m".
export function formatHours(hours) {
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  return `${h}h ${m}m`;
}
