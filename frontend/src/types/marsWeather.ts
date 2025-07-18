// Mars weather API and chart types

export interface WindDirectionData {
  compass_degrees: number;
  compass_point: string;
  compass_right: number;
  compass_up: number;
  ct: number;
}

export interface SolWeatherData {
  AT?: { av?: number; mn?: number; mx?: number };
  HWS?: { av?: number };
  PRE?: { av?: number; mn?: number; mx?: number };
  WD?: { [key: string]: WindDirectionData | { [k: string]: any } };
}

export interface InsightWeatherApiResponse {
  sol_keys: string[];
  [sol: string]: SolWeatherData | any;
}

export interface ChartDatum {
  x: string;
  y: number | null;
}

export interface RadarDatum {
  direction: string;
  [sol: string]: number | string;
} 