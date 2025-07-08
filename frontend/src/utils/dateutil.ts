export function getEasternDateString(): string {
	const now = new Date();
	const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
	if (eastern.getHours() === 0 && eastern.getMinutes() < 5) {
	  eastern.setDate(eastern.getDate() - 1);
	}
	return eastern.toISOString().slice(0, 10);
  }
  