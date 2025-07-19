export function getEasternDateString(): string {
	const now = new Date();
	const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
	if (eastern.getHours() === 0 && eastern.getMinutes() < 5) {
	  eastern.setDate(eastern.getDate() - 1);
	}
	return eastern.toISOString().slice(0, 10);
  }
  
export function formatDateString(dateString: string): string {
  // Expects dateString in 'YYYY-MM-DD' format
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function clampDateToRange(dateString: string, minDate: string, maxDate: string): string {
  const date = new Date(dateString);
  const min = new Date(minDate);
  const max = new Date(maxDate);
  if (date < min) return minDate;
  if (date > max) return maxDate;
  return dateString;
}

export function daysBetween(dateA: string, dateB: string): number {
  // Returns days between dateA and dateB (dateA - dateB)
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
  
/**
 * Formats a date string into a human-readable string in UTC, e.g. 'June 1, 2024, 14:00'.
 * Returns '-' if input is falsy or invalid.
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'UTC',
  });
}
  
/**
 * Formats a date string as 'Mon DD, HH:mm' in UTC (e.g., 'Jun 1, 14:00').
 * Returns '-' if input is falsy or invalid.
 */
export function formatShortDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  // Use toLocaleString with options, then remove year if present
  let str = d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'UTC',
  });
  // Remove any trailing year (e.g., 'Jun 1, 14:00')
  return str.replace(/,?\s*\d{4}/, '');
}
  