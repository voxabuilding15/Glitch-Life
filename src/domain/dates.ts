import type { DateKey, Weekday, WeekStart } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Local date key for a Date, using the device's local calendar day. */
export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidDateKey(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function utcMs(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DateKey {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Calendar arithmetic done in UTC so DST shifts never move a date. */
export function addDays(key: DateKey, n: number): DateKey {
  return fromUtcMs(utcMs(key) + n * 86_400_000);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((utcMs(b) - utcMs(a)) / 86_400_000);
}

export function weekdayOf(key: DateKey): Weekday {
  return new Date(utcMs(key)).getUTCDay() as Weekday;
}

export function startOfWeek(key: DateKey, weekStart: WeekStart): DateKey {
  const first = weekStart === 'monday' ? 1 : 0;
  const offset = (weekdayOf(key) - first + 7) % 7;
  return addDays(key, -offset);
}

export function weekKeys(key: DateKey, weekStart: WeekStart): DateKey[] {
  const start = startOfWeek(key, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

export function monthKeys(year: number, month0: number): DateKey[] {
  return Array.from({ length: daysInMonth(year, month0) }, (_, i) => `${year}-${pad(month0 + 1)}-${pad(i + 1)}`);
}

export function yearMonthOf(key: DateKey): { year: number; month0: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month0: m - 1 };
}

export function addMonths(year: number, month0: number, n: number): { year: number; month0: number } {
  const total = year * 12 + month0 + n;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatLongDate(key: DateKey): string {
  const { year, month0 } = yearMonthOf(key);
  const day = Number(key.slice(8, 10));
  return `${WEEKDAY_NAMES[weekdayOf(key)]}, ${MONTH_NAMES[month0]} ${day}, ${year}`;
}

export function formatShortDate(key: DateKey): string {
  const { month0 } = yearMonthOf(key);
  return `${MONTH_NAMES[month0].slice(0, 3)} ${Number(key.slice(8, 10))}, ${key.slice(0, 4)}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s === 0) return '0 min';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${suffix}`;
}

/** Milliseconds until the next local midnight. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** Empty cells needed before the 1st so a month grid lines up with the chosen week start. */
export function leadingBlanks(year: number, month0: number, weekStart: WeekStart): number {
  const first = weekStart === 'monday' ? 1 : 0;
  const firstDow = new Date(Date.UTC(year, month0, 1)).getUTCDay();
  return (firstDow - first + 7) % 7;
}

export function weekdayLetters(weekStart: WeekStart): string[] {
  return weekStart === 'monday' ? [...WEEKDAY_LETTER.slice(1), WEEKDAY_LETTER[0]] : WEEKDAY_LETTER;
}
