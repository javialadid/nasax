/**
 * Utility function to get environment variables with type checking
 * @param key Environment variable key
 * @param defaultValue Default value if env variable is not set
 * @param type Expected type ('string' or 'number')
 * @returns Environment variable value or default
 */
function getEnv<T extends string | number>(key: string, defaultValue: T, type: 'string' | 'number'): T {
  try {
    if (typeof import.meta === 'undefined' || !import.meta.env) {
      return defaultValue;
    }

    const value = import.meta.env[key];
    if (value === undefined) {
      return defaultValue;
    }

    if (type === 'number') {
      const parsed = parseInt(value as string, 10);
      if (isNaN(parsed)) {
        return defaultValue;
      }
      return parsed as T;
    }

    return value as T;
  } catch (error) {
    return defaultValue;
  }
}

export function getApiBaseUrl(defaultValue: string = 'http://localhost:3000/api'): string {
  return getEnv('VITE_API_BASE_URL', defaultValue, 'string');
}

export function getMaxDaysBackApod(defaultValue: number = 7): number {
  return getEnv('VITE_MAX_DAYS_BACK_APOD', defaultValue, 'number');
}

export function getMaxDaysBackEpic(defaultValue: number = 7): number {
  return getEnv('VITE_MAX_DAYS_BACK_EPIC', defaultValue, 'number');
}