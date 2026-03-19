export function calcAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  if (days < 7) return `${days}D OLD`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (weeks < 52) return `${weeks}W ${rem}D OLD`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months}M OLD`;
  return `${Math.floor(months / 12)}Y OLD`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Suggest `count` datetime-local values in the past.
 * - Floors "now" to the latest `stepMinutes` boundary first
 * - Then steps back by `stepMinutes` to generate suggestions.
 *
 * Example:
 * - now = 12:02, step=15 => base=12:00 => [11:45, 11:30, 11:15, 11:00, 10:45, 10:30]
 */
export function getRecentDateTimeSuggestions(
  count = 6,
  stepMinutes = 15,
): string[] {
  const now = new Date();
  now.setSeconds(0, 0);

  const base = new Date(now);
  const m = base.getMinutes();
  base.setMinutes(m - (m % stepMinutes));
  base.setSeconds(0, 0);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setMinutes(d.getMinutes() - (i + 1) * stepMinutes);
    return toLocalDatetimeValue(d);
  });
}

/**
 * Suggest `count` Date objects in the past, stepped by `stepMinutes`.
 * Uses the same flooring rule as `getRecentDateTimeSuggestions`.
 */
export function getRecentTimeSuggestions(
  count = 6,
  stepMinutes = 15,
): Date[] {
  const now = new Date();
  now.setSeconds(0, 0);

  const base = new Date(now);
  const m = base.getMinutes();
  base.setMinutes(m - (m % stepMinutes));
  base.setSeconds(0, 0);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setMinutes(d.getMinutes() - (i + 1) * stepMinutes);
    return d;
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "TODAY";
  if (sameDay(d, yesterday)) return "YESTERDAY";

  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}
