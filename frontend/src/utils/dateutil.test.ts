import {
  getEasternDateString,
  formatDateString,
  clampDateToRange,
  daysBetween,
  addDays
} from '@/utils/dateutil';

describe('getEasternDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const date = getEasternDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDateString', () => {
  it('formats a YYYY-MM-DD string to a readable date', () => {
    expect(formatDateString('2024-07-16')).toMatch(/2024/);
    expect(formatDateString('2024-07-16')).toMatch(/July/);
    expect(formatDateString('2024-07-16')).toMatch(/16/);
  });
});

describe('clampDateToRange', () => {
  it('returns the date if within range', () => {
    expect(clampDateToRange('2024-07-16', '2024-07-10', '2024-07-20')).toBe('2024-07-16');
  });
  it('returns minDate if date is before range', () => {
    expect(clampDateToRange('2024-07-01', '2024-07-10', '2024-07-20')).toBe('2024-07-10');
  });
  it('returns maxDate if date is after range', () => {
    expect(clampDateToRange('2024-07-30', '2024-07-10', '2024-07-20')).toBe('2024-07-20');
  });
});

describe('daysBetween', () => {
  it('returns the number of days between two dates', () => {
    expect(daysBetween('2024-07-20', '2024-07-10')).toBe(10);
    expect(daysBetween('2024-07-10', '2024-07-20')).toBe(-10);
  });
});

describe('addDays', () => {
  it('adds days to a date', () => {
    expect(addDays('2024-07-10', 5)).toBe('2024-07-15');
  });
  it('subtracts days from a date', () => {
    expect(addDays('2024-07-10', -5)).toBe('2024-07-05');
  });
}); 