export interface IDeviceRecommendation {
  message: string;
  severity: 'warning' | 'error';
  link?: string;
}

export const TROUBLESHOOTER_CODES = {
  browser_unkown: {},
  chrome_outdated: {},
  storage_low: {},
} as const;
