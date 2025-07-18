import { COMPASS_DIRECTIONS_16 } from '../constants/marsWeather';
import { InsightWeatherApiResponse, ChartDatum, RadarDatum } from '../types/marsWeather';

/**
 * Prepare line chart data for temperature, wind, and pressure for the last 12 sols.
 * @param data Mars weather API response or null
 * @returns Object with arrays for temp, tempMin, tempMax, wind, pressure, pressureMin, pressureMax, and heatmap
 */
export function prepareChartData(data: InsightWeatherApiResponse | null) {
  if (!data || !data.sol_keys) return { temp: [], tempMin: [], tempMax: [], wind: [], pressure: [], pressureMin: [], pressureMax: [], heatmap: [] };
  const sols = data.sol_keys.slice(-12); // Only last 12 sols
  const temp: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.AT?.av ?? null }));
  const tempMin: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.AT?.mn ?? null }));
  const tempMax: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.AT?.mx ?? null }));
  const wind: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.HWS?.av ?? null }));
  const pressure: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.PRE?.av ?? null }));
  const pressureMin: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.PRE?.mn ?? null }));
  const pressureMax: ChartDatum[] = sols.map((sol: string) => ({ x: sol, y: data[sol]?.PRE?.mx ?? null }));
  // For heatmap: each sol is a row, columns are temp/wind/pressure
  const heatmap = sols.map((sol: string) => ({
    id: sol,
    Temp: data[sol]?.AT?.av ?? 0,
    Wind: data[sol]?.HWS?.av ?? 0,
    Pressure: data[sol]?.PRE?.av ?? 0,
  }));
  return { temp, tempMin, tempMax, wind, pressure, pressureMin, pressureMax, heatmap };
}

/**
 * Get min, max, lower (10th percentile), and upper (90th percentile) for a key in an array of objects.
 * @param arr Array of objects with numeric values
 * @param key The key to extract values for
 * @returns Object with min, max, lower, and upper values
 */
export function getExtremes(arr: { [key: string]: number }[], key: string) {
  const values = arr.map((d: { [key: string]: number }) => d[key]).filter((v: number) => typeof v === 'number');
  if (values.length === 0) return { min: null, max: null, lower: null, upper: null };
  const sorted = [...values].sort((a: number, b: number) => a - b);
  const lower = sorted[Math.floor(0.1 * sorted.length)];
  const upper = sorted[Math.floor(0.9 * sorted.length)];
  return { min: sorted[0], max: sorted[sorted.length - 1], lower, upper };
} 