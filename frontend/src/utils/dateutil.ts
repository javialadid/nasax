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
  