import { fromZonedTime } from 'date-fns-tz';

// See the full list of valid IANA timezone strings at:
// https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
// Example: 'America/New_York', 'Europe/London', 'Asia/Tokyo', etc.

// Returns the number of seconds until the given date (YYYY-MM-DD) comes into effect in the specified timezone
export function secondsUntilDateTz(dateString: string, tz: string = "America/New_York"): number {
    // Midnight at the start of the date in the target timezone
    const targetMidnightTz = `${dateString}T00:00:00`;    
    const targetUtc = fromZonedTime(targetMidnightTz, tz);    
    const nowUtc = new Date();
    // Difference in seconds
    const diffSeconds = Math.floor((targetUtc.getTime() - nowUtc.getTime()) / 1000);
    return diffSeconds;
}

// Returns the number of seconds until the given ISO datetime (e.g. 2025-07-16T18:53Z) in UTC
export function secondsUntilIsoDateTime(dateTimeString: string): number {
    const target = new Date(dateTimeString);
    const now = new Date();
    const diffSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
    return diffSeconds;
}
