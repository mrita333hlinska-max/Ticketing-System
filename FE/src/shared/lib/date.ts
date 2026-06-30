/**
 * Format an ISO-8601 timestamp (UTC, from the API — REQUIREMENTS §9) as a
 * short, locale-aware date (e.g. "Jun 30").
 */
export function formatShortDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Full date + time in UTC, matching the ticket meta line in the design
 * (e.g. "Jun 22, 09:15 UTC"). Timestamps are UTC from the API (§9).
 */
export function formatDateTimeUtc(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  const formatted = date.toLocaleString(undefined, {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${formatted} UTC`;
}

/**
 * Compact relative time from an ISO-8601 timestamp, matching the board card
 * style in the design (e.g. "2h ago", "1d ago", "just now").
 */
export function formatRelativeTime(
  isoTimestamp: string,
  now: number = Date.now(),
): string {
  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((now - then) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
