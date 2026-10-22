import { TIMEZONE } from './config';

export function fmtTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function fmtDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export function fmtClock(date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function fmtDateLong(date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

// Returns a date like 2026-10-22 in Philippine time.
export function manilaDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);
}

export function hoursBetween(start, end) {
  if (!end) return null;
  const hours = (new Date(end) - new Date(start)) / 36e5;
  return hours.toFixed(2);
}
