/**
 * Relative Oceanic Niño Index (RONI) ENSO dataset.
 *
 * Source: Golden Gate Weather Services / NOAA
 * URL: https://ggweather.com/enso/roni.htm
 *
 * The Relative Oceanic Niño Index (RONI) is the de-facto standard NOAA uses for classifying
 * El Niño (warm) and La Niña (cool) events in the eastern tropical Pacific.
 * It is the running 3-month mean SST anomaly for the Niño 3.4 region (5°N-5°S, 120°-170°W)
 * minus the overall average tropical 3-month sea surface temperature anomaly (SSTA).
 *
 * Event criteria:
 * - El Niño: >= +0.5°C anomaly for 5 consecutive overlapping 3-month periods.
 * - La Niña: <= -0.5°C anomaly for 5 consecutive overlapping 3-month periods.
 * - Category assignment requires equaling or exceeding the category threshold for at least 3 consecutive overlapping periods.
 * - Weak (WE/WL): 0.5 to 0.9 SST anomaly
 * - Moderate (ME/ML): 1.0 to 1.4 SST anomaly
 * - Strong (SE/SL): 1.5 to 1.9 SST anomaly
 * - Very Strong (VSE): >= 2.0 SST anomaly (El Niño only)
 */

export const RONI_DATA_SOURCE = {
  name: 'Golden Gate Weather Services / NOAA',
  title: 'Relative Oceanic Niño Index (RONI)',
  url: 'https://ggweather.com/enso/roni.htm',
  description:
    'The Relative Oceanic Niño Index (RONI) tracks running 3-month mean SST anomalies for the Niño 3.4 region minus the tropical average SSTA.',
} as const;

export type EnsoGrade = 1 | 2 | 3 | 4;
export type EnsoCategory = 'el_nino' | 'la_nina' | 'neutral';
export type EnsoType = 'WE' | 'ME' | 'SE' | 'VSE' | 'WL' | 'ML' | 'SL' | null;

export const THREE_MONTH_PERIOD_KEYS = [
  'jja',
  'jas',
  'aso',
  'son',
  'ond',
  'ndj',
  'djf',
  'jfm',
  'fma',
  'mam',
  'amj',
  'mjj',
] as const;

export type ThreeMonthPeriodKey = (typeof THREE_MONTH_PERIOD_KEYS)[number];

export interface IRoniSeasonRecord {
  season: string; // e.g. "1957-1958"
  startYear: number; // e.g. 1957
  endYear: number; // e.g. 1958
  ensoType: EnsoType;
  category: EnsoCategory;
  grade: EnsoGrade | null;
  values: Record<ThreeMonthPeriodKey, number | null>;
}

export interface IEnsoGradeConfig {
  grade: EnsoGrade;
  label: string;
  code: string;
  threshold: string;
  color: string;
  stroke: string;
  size: number;
}

/** El Niño gradings 1 to 4: lighter to darker shades of orange/red and growing sizes */
export const EL_NINO_GRADES: Record<EnsoGrade, IEnsoGradeConfig> = {
  1: {
    grade: 1,
    label: 'Weak',
    code: 'WE',
    threshold: '+0.5 to +0.9',
    color: '#f5a65b',
    stroke: '#d9771c',
    size: 6.5,
  },
  2: {
    grade: 2,
    label: 'Moderate',
    code: 'ME',
    threshold: '+1.0 to +1.4',
    color: '#e0731e',
    stroke: '#b8540b',
    size: 8.5,
  },
  3: {
    grade: 3,
    label: 'Strong',
    code: 'SE',
    threshold: '+1.5 to +1.9',
    color: '#c44601',
    stroke: '#943200',
    size: 10.5,
  },
  4: {
    grade: 4,
    label: 'Very Strong',
    code: 'VSE',
    threshold: '≥ +2.0',
    color: '#8c1b07',
    stroke: '#5e1003',
    size: 12.5,
  },
};

/** La Niña gradings 1 to 3: lighter to darker shades of blue and growing sizes */
export const LA_NINA_GRADES: Record<1 | 2 | 3, IEnsoGradeConfig> = {
  1: {
    grade: 1,
    label: 'Weak',
    code: 'WL',
    threshold: '-0.5 to -0.9',
    color: '#72b1e8',
    stroke: '#3b8ccf',
    size: 6.5,
  },
  2: {
    grade: 2,
    label: 'Moderate',
    code: 'ML',
    threshold: '-1.0 to -1.4',
    color: '#2d78bf',
    stroke: '#1b568c',
    size: 8.5,
  },
  3: {
    grade: 3,
    label: 'Strong',
    code: 'SL',
    threshold: '≤ -1.5',
    color: '#0e457b',
    stroke: '#082a4d',
    size: 11.0,
  },
};

/**
 * Digitised Relative Oceanic Niño Index (RONI) 1949-1950 through 2026-2027.
 * Running 3-month mean SST anomaly for the Niño 3.4 region minus tropical average SSTA.
 */
export const RONI_SEASON_RECORDS: IRoniSeasonRecord[] = [
  { season: '1949-1950', startYear: 1949, endYear: 1950, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -0.96, jas: -0.96, aso: -0.79, son: -0.83, ond: -1.04, ndj: -1.41, djf: -1.64, jfm: -1.49, fma: -1.38, mam: -1.27, amj: -1.13, mjj: -0.97 } },
  { season: '1950-1951', startYear: 1950, endYear: 1951, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.75, jas: -0.71, aso: -0.74, son: -0.87, ond: -1.05, ndj: -1.14, djf: -1.10, jfm: -0.97, fma: -0.76, mam: -0.45, amj: -0.19, mjj: 0.08 } },
  { season: '1951-1952', startYear: 1951, endYear: 1952, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.38, jas: 0.65, aso: 0.77, son: 0.78, ond: 0.73, ndj: 0.58, djf: 0.44, jfm: 0.38, fma: 0.34, mam: 0.28, amj: 0.16, mjj: 0.02 } },
  { season: '1952-1953', startYear: 1952, endYear: 1953, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.06, jas: 0.03, aso: 0.16, son: 0.18, ond: 0.25, ndj: 0.43, djf: 0.57, jfm: 0.66, fma: 0.65, mam: 0.64, amj: 0.62, mjj: 0.56 } },
  { season: '1953-1954', startYear: 1953, endYear: 1954, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.55, jas: 0.61, aso: 0.61, son: 0.55, ond: 0.51, ndj: 0.46, djf: 0.32, jfm: 0.04, fma: -0.32, mam: -0.57, amj: -0.66, mjj: -0.70 } },
  { season: '1954-1955', startYear: 1954, endYear: 1955, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.76, jas: -0.85, aso: -0.89, son: -0.80, ond: -0.75, ndj: -0.79, djf: -0.77, jfm: -0.68, fma: -0.65, mam: -0.70, amj: -0.75, mjj: -0.73 } },
  { season: '1955-1956', startYear: 1955, endYear: 1956, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.68, jas: -0.73, aso: -0.99, son: -1.37, ond: -1.63, ndj: -1.66, djf: -1.38, jfm: -1.02, fma: -0.72, mam: -0.58, amj: -0.52, mjj: -0.47 } },
  { season: '1956-1957', startYear: 1956, endYear: 1957, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.50, jas: -0.52, aso: -0.47, son: -0.39, ond: -0.36, ndj: -0.30, djf: -0.19, jfm: 0.04, fma: 0.42, mam: 0.77, amj: 0.95, mjj: 1.05 } },
  { season: '1957-1958', startYear: 1957, endYear: 1958, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 1.05, jas: 1.03, aso: 1.00, son: 1.12, ond: 1.34, ndj: 1.58, djf: 1.63, jfm: 1.44, fma: 1.06, mam: 0.70, amj: 0.52, mjj: 0.48 } },
  { season: '1958-1959', startYear: 1958, endYear: 1959, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.47, jas: 0.41, aso: 0.35, son: 0.38, ond: 0.49, ndj: 0.55, djf: 0.54, jfm: 0.49, fma: 0.43, mam: 0.34, amj: 0.17, mjj: -0.07 } },
  { season: '1959-1960', startYear: 1959, endYear: 1960, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.21, jas: -0.21, aso: -0.18, son: -0.08, ond: -0.06, ndj: -0.08, djf: -0.10, jfm: -0.11, fma: -0.11, mam: -0.14, amj: -0.12, mjj: -0.05 } },
  { season: '1960-1961', startYear: 1960, endYear: 1961, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.05, jas: 0.13, aso: 0.12, son: 0.02, ond: -0.08, ndj: -0.14, djf: -0.16, jfm: -0.10, fma: -0.03, mam: 0.08, amj: 0.19, mjj: 0.20 } },
  { season: '1961-1962', startYear: 1961, endYear: 1962, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.16, jas: 0.03, aso: -0.16, son: -0.32, ond: -0.35, ndj: -0.28, djf: -0.25, jfm: -0.33, fma: -0.42, mam: -0.46, amj: -0.45, mjj: -0.38 } },
  { season: '1962-1963', startYear: 1962, endYear: 1963, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.27, jas: -0.16, aso: -0.09, son: -0.14, ond: -0.30, ndj: -0.45, djf: -0.48, jfm: -0.38, fma: -0.25, mam: -0.15, amj: -0.01, mjj: 0.25 } },
  { season: '1963-1964', startYear: 1963, endYear: 1964, ensoType: 'ME', category: 'el_nino', grade: 2, values: { jja: 0.58, jas: 0.88, aso: 1.05, son: 1.15, ond: 1.25, ndj: 1.19, djf: 0.98, jfm: 0.65, fma: 0.29, mam: 0.03, amj: -0.21, mjj: -0.46 } },
  { season: '1964-1965', startYear: 1964, endYear: 1965, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.68, jas: -0.83, aso: -0.89, son: -0.99, ond: -1.09, ndj: -1.07, djf: -0.87, jfm: -0.56, fma: -0.29, mam: -0.12, amj: 0.07, mjj: 0.35 } },
  { season: '1965-1966', startYear: 1965, endYear: 1966, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 0.70, jas: 1.06, aso: 1.34, son: 1.55, ond: 1.63, ndj: 1.54, djf: 1.30, jfm: 1.06, fma: 0.85, mam: 0.59, amj: 0.34, mjj: 0.22 } },
  { season: '1966-1967', startYear: 1966, endYear: 1967, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.17, jas: 0.04, aso: -0.10, son: -0.19, ond: -0.21, ndj: -0.23, djf: -0.32, jfm: -0.44, fma: -0.49, mam: -0.45, amj: -0.34, mjj: -0.25 } },
  { season: '1967-1968', startYear: 1967, endYear: 1968, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.24, jas: -0.31, aso: -0.42, son: -0.51, ond: -0.59, ndj: -0.66, djf: -0.71, jfm: -0.72, fma: -0.70, mam: -0.72, amj: -0.69, mjj: -0.52 } },
  { season: '1968-1969', startYear: 1968, endYear: 1969, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: -0.22, jas: 0.11, aso: 0.38, son: 0.53, ond: 0.67, ndj: 0.84, djf: 0.94, jfm: 0.90, fma: 0.75, mam: 0.59, amj: 0.50, mjj: 0.44 } },
  { season: '1969-1970', startYear: 1969, endYear: 1970, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.39, jas: 0.37, aso: 0.47, son: 0.69, ond: 0.81, ndj: 0.73, djf: 0.54, jfm: 0.42, fma: 0.36, mam: 0.28, amj: 0.01, mjj: -0.35 } },
  { season: '1970-1971', startYear: 1970, endYear: 1971, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.65, jas: -0.80, aso: -0.85, son: -0.86, ond: -0.91, ndj: -0.99, djf: -1.14, jfm: -1.25, fma: -1.16, mam: -0.98, amj: -0.86, mjj: -0.84 } },
  { season: '1971-1972', startYear: 1971, endYear: 1972, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.86, jas: -0.85, aso: -0.86, son: -0.89, ond: -0.92, ndj: -0.88, djf: -0.73, jfm: -0.56, fma: -0.39, mam: -0.19, amj: 0.15, mjj: 0.54 } },
  { season: '1972-1973', startYear: 1972, endYear: 1973, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 0.81, jas: 1.15, aso: 1.48, son: 1.77, ond: 1.93, ndj: 1.91, djf: 1.62, jfm: 1.13, fma: 0.59, mam: 0.13, amj: -0.27, mjj: -0.63 } },
  { season: '1973-1974', startYear: 1973, endYear: 1974, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -0.99, jas: -1.27, aso: -1.49, son: -1.78, ond: -1.95, ndj: -1.93, djf: -1.82, jfm: -1.60, fma: -1.33, mam: -1.04, amj: -0.87, mjj: -0.73 } },
  { season: '1974-1975', startYear: 1974, endYear: 1975, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.58, jas: -0.45, aso: -0.44, son: -0.62, ond: -0.78, ndj: -0.76, djf: -0.63, jfm: -0.59, fma: -0.62, mam: -0.73, amj: -0.89, mjj: -1.06 } },
  { season: '1975-1976', startYear: 1975, endYear: 1976, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -1.21, jas: -1.36, aso: -1.50, son: -1.57, ond: -1.64, ndj: -1.63, djf: -1.53, jfm: -1.31, fma: -0.99, mam: -0.68, amj: -0.42, mjj: -0.23 } },
  { season: '1976-1977', startYear: 1976, endYear: 1977, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: -0.11, jas: 0.11, aso: 0.35, son: 0.58, ond: 0.70, ndj: 0.71, djf: 0.62, jfm: 0.49, fma: 0.34, mam: 0.22, amj: 0.17, mjj: 0.24 } },
  { season: '1977-1978', startYear: 1977, endYear: 1978, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.34, jas: 0.43, aso: 0.52, son: 0.66, ond: 0.78, ndj: 0.81, djf: 0.71, jfm: 0.51, fma: 0.29, mam: 0.08, amj: -0.15, mjj: -0.32 } },
  { season: '1978-1979', startYear: 1978, endYear: 1979, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.34, jas: -0.32, aso: -0.30, son: -0.22, ond: -0.10, ndj: -0.06, djf: -0.08, jfm: -0.11, fma: -0.11, mam: -0.08, amj: 0.03, mjj: 0.12 } },
  { season: '1979-1980', startYear: 1979, endYear: 1980, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.18, jas: 0.23, aso: 0.29, son: 0.38, ond: 0.54, ndj: 0.59, djf: 0.54, jfm: 0.44, fma: 0.30, mam: 0.29, amj: 0.37, mjj: 0.41 } },
  { season: '1980-1981', startYear: 1980, endYear: 1981, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.34, jas: 0.15, aso: -0.04, son: -0.09, ond: -0.04, ndj: -0.07, djf: -0.21, jfm: -0.37, fma: -0.42, mam: -0.39, amj: -0.30, mjj: -0.18 } },
  { season: '1981-1982', startYear: 1981, endYear: 1982, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.14, jas: -0.21, aso: -0.27, son: -0.22, ond: -0.09, ndj: 0.05, djf: 0.12, jfm: 0.14, fma: 0.20, mam: 0.40, amj: 0.69, mjj: 0.94 } },
  { season: '1982-1983', startYear: 1982, endYear: 1983, ensoType: 'VSE', category: 'el_nino', grade: 4, values: { jja: 1.15, jas: 1.39, aso: 1.74, son: 2.15, ond: 2.43, ndj: 2.45, djf: 2.27, jfm: 1.94, fma: 1.63, mam: 1.34, amj: 1.05, mjj: 0.68 } },
  { season: '1983-1984', startYear: 1983, endYear: 1984, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: 0.19, jas: -0.26, aso: -0.58, son: -0.84, ond: -0.99, ndj: -0.94, djf: -0.68, jfm: -0.42, fma: -0.30, mam: -0.38, amj: -0.49, mjj: -0.45 } },
  { season: '1984-1985', startYear: 1984, endYear: 1985, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.38, jas: -0.34, aso: -0.45, son: -0.73, ond: -1.02, ndj: -1.14, djf: -1.08, jfm: -0.97, fma: -0.89, mam: -0.88, amj: -0.83, mjj: -0.68 } },
  { season: '1985-1986', startYear: 1985, endYear: 1986, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.55, jas: -0.49, aso: -0.49, son: -0.46, ond: -0.45, ndj: -0.48, djf: -0.55, jfm: -0.57, fma: -0.54, mam: -0.44, amj: -0.32, mjj: -0.19 } },
  { season: '1986-1987', startYear: 1986, endYear: 1987, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: -0.05, jas: 0.20, aso: 0.54, son: 0.84, ond: 1.05, ndj: 1.15, djf: 1.21, jfm: 1.25, fma: 1.22, mam: 1.25, amj: 1.34, mjj: 1.51 } },
  { season: '1987-1988', startYear: 1987, endYear: 1988, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 1.63, jas: 1.63, aso: 1.48, son: 1.28, ond: 1.10, ndj: 0.81, djf: 0.44, jfm: 0.11, fma: -0.27, mam: -0.71, amj: -1.15, mjj: -1.40 } },
  { season: '1988-1989', startYear: 1988, endYear: 1989, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -1.53, jas: -1.61, aso: -1.68, son: -1.82, ond: -1.89, ndj: -1.77, djf: -1.64, jfm: -1.47, fma: -1.21, mam: -0.92, amj: -0.71, mjj: -0.50 } },
  { season: '1989-1990', startYear: 1989, endYear: 1990, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.35, jas: -0.31, aso: -0.31, son: -0.28, ond: -0.22, ndj: -0.04, djf: 0.17, jfm: 0.26, fma: 0.26, mam: 0.29, amj: 0.32, mjj: 0.31 } },
  { season: '1990-1991', startYear: 1990, endYear: 1991, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.29, jas: 0.32, aso: 0.32, son: 0.24, ond: 0.25, ndj: 0.37, djf: 0.40, jfm: 0.32, fma: 0.24, mam: 0.24, amj: 0.36, mjj: 0.55 } },
  { season: '1991-1992', startYear: 1991, endYear: 1992, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 0.70, jas: 0.77, aso: 0.75, son: 0.88, ond: 1.25, ndj: 1.58, djf: 1.70, jfm: 1.62, fma: 1.51, mam: 1.34, amj: 1.00, mjj: 0.54 } },
  { season: '1992-1993', startYear: 1992, endYear: 1993, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.15, jas: -0.04, aso: -0.12, son: -0.14, ond: -0.04, ndj: 0.10, djf: 0.21, jfm: 0.35, fma: 0.51, mam: 0.64, amj: 0.69, mjj: 0.58 } },
  { season: '1993-1994', startYear: 1993, endYear: 1994, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.39, jas: 0.28, aso: 0.29, son: 0.29, ond: 0.18, ndj: 0.11, djf: 0.08, jfm: 0.04, fma: 0.09, mam: 0.26, amj: 0.40, mjj: 0.44 } },
  { season: '1994-1995', startYear: 1994, endYear: 1995, ensoType: 'ME', category: 'el_nino', grade: 2, values: { jja: 0.43, jas: 0.46, aso: 0.59, son: 0.85, ond: 1.13, ndj: 1.22, djf: 1.05, jfm: 0.78, fma: 0.56, mam: 0.33, amj: 0.11, mjj: -0.08 } },
  { season: '1995-1996', startYear: 1995, endYear: 1996, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.22, jas: -0.42, aso: -0.66, son: -0.84, ond: -0.89, ndj: -0.84, djf: -0.79, jfm: -0.73, fma: -0.65, mam: -0.47, amj: -0.32, mjj: -0.26 } },
  { season: '1996-1997', startYear: 1996, endYear: 1997, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.26, jas: -0.30, aso: -0.33, son: -0.36, ond: -0.40, ndj: -0.42, djf: -0.41, jfm: -0.30, fma: -0.06, mam: 0.31, amj: 0.77, mjj: 1.26 } },
  { season: '1997-1998', startYear: 1997, endYear: 1998, ensoType: 'VSE', category: 'el_nino', grade: 4, values: { jja: 1.64, jas: 1.89, aso: 2.07, son: 2.29, ond: 2.39, ndj: 2.30, djf: 2.14, jfm: 1.83, fma: 1.34, mam: 0.85, amj: 0.36, mjj: -0.27 } },
  { season: '1998-1999', startYear: 1998, endYear: 1999, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.88, jas: -1.21, aso: -1.27, son: -1.27, ond: -1.36, ndj: -1.48, djf: -1.48, jfm: -1.33, fma: -1.04, mam: -0.87, amj: -0.88, mjj: -0.92 } },
  { season: '1999-2000', startYear: 1999, endYear: 2000, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.98, jas: -1.00, aso: -1.02, son: -1.13, ond: -1.35, ndj: -1.53, djf: -1.50, jfm: -1.39, fma: -1.18, mam: -0.87, amj: -0.66, mjj: -0.58 } },
  { season: '2000-2001', startYear: 2000, endYear: 2001, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.53, jas: -0.49, aso: -0.50, son: -0.60, ond: -0.73, ndj: -0.74, djf: -0.66, jfm: -0.55, fma: -0.43, mam: -0.32, amj: -0.19, mjj: -0.06 } },
  { season: '2001-2002', startYear: 2001, endYear: 2002, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.05, jas: 0.09, aso: 0.03, son: -0.12, ond: -0.27, ndj: -0.28, djf: -0.13, jfm: 0.08, fma: 0.20, mam: 0.32, amj: 0.52, mjj: 0.69 } },
  { season: '2002-2003', startYear: 2002, endYear: 2003, ensoType: 'ME', category: 'el_nino', grade: 2, values: { jja: 0.77, jas: 0.81, aso: 0.84, son: 0.99, ond: 1.15, ndj: 1.17, djf: 0.97, jfm: 0.68, fma: 0.37, mam: 0.02, amj: -0.28, mjj: -0.29 } },
  { season: '2003-2004', startYear: 2003, endYear: 2004, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.14, jas: 0.06, aso: 0.21, son: 0.30, ond: 0.31, ndj: 0.27, djf: 0.23, jfm: 0.17, fma: 0.08, mam: 0.08, amj: 0.11, mjj: 0.31 } },
  { season: '2004-2005', startYear: 2004, endYear: 2005, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.49, jas: 0.58, aso: 0.60, son: 0.64, ond: 0.68, ndj: 0.67, djf: 0.56, jfm: 0.44, fma: 0.34, mam: 0.28, amj: 0.25, mjj: 0.14 } },
  { season: '2005-2006', startYear: 2005, endYear: 2006, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: 0.08, jas: 0.02, aso: -0.15, son: -0.40, ond: -0.66, ndj: -0.80, djf: -0.79, jfm: -0.64, fma: -0.45, mam: -0.26, amj: -0.06, mjj: 0.07 } },
  { season: '2006-2007', startYear: 2006, endYear: 2007, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.15, jas: 0.27, aso: 0.45, son: 0.69, ond: 0.88, ndj: 0.85, djf: 0.60, jfm: 0.23, fma: -0.09, mam: -0.27, amj: -0.38, mjj: -0.48 } },
  { season: '2007-2008', startYear: 2007, endYear: 2008, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -0.53, jas: -0.73, aso: -1.02, son: -1.27, ond: -1.45, ndj: -1.56, djf: -1.61, jfm: -1.51, fma: -1.27, mam: -0.99, amj: -0.78, mjj: -0.58 } },
  { season: '2008-2009', startYear: 2008, endYear: 2009, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.37, jas: -0.26, aso: -0.27, son: -0.38, ond: -0.53, ndj: -0.70, djf: -0.79, jfm: -0.73, fma: -0.58, mam: -0.33, amj: -0.01, mjj: 0.36 } },
  { season: '2009-2010', startYear: 2009, endYear: 2010, ensoType: 'ME', category: 'el_nino', grade: 2, values: { jja: 0.48, jas: 0.54, aso: 0.64, son: 0.90, ond: 1.19, ndj: 1.34, djf: 1.30, jfm: 1.07, fma: 0.77, mam: 0.38, amj: -0.09, mjj: -0.62 } },
  { season: '2010-2011', startYear: 2010, endYear: 2011, ensoType: 'SL', category: 'la_nina', grade: 3, values: { jja: -1.04, jas: -1.37, aso: -1.55, son: -1.60, ond: -1.58, ndj: -1.51, djf: -1.41, jfm: -1.24, fma: -0.98, mam: -0.67, amj: -0.42, mjj: -0.32 } },
  { season: '2011-2012', startYear: 2011, endYear: 2012, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.36, jas: -0.57, aso: -0.77, son: -0.94, ond: -1.04, ndj: -1.01, djf: -0.89, jfm: -0.69, fma: -0.49, mam: -0.29, amj: -0.15, mjj: 0.08 } },
  { season: '2012-2013', startYear: 2012, endYear: 2013, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.28, jas: 0.36, aso: 0.29, son: 0.06, ond: -0.19, ndj: -0.35, djf: -0.43, jfm: -0.42, fma: -0.38, mam: -0.28, amj: -0.24, mjj: -0.26 } },
  { season: '2013-2014', startYear: 2013, endYear: 2014, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.33, jas: -0.36, aso: -0.33, son: -0.24, ond: -0.22, ndj: -0.29, djf: -0.44, jfm: -0.50, fma: -0.41, mam: -0.22, amj: 0.02, mjj: 0.17 } },
  { season: '2014-2015', startYear: 2014, endYear: 2015, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.16, jas: 0.07, aso: 0.13, son: 0.34, ond: 0.53, ndj: 0.58, djf: 0.54, jfm: 0.52, fma: 0.55, mam: 0.70, amj: 0.90, mjj: 1.10 } },
  { season: '2015-2016', startYear: 2015, endYear: 2016, ensoType: 'VSE', category: 'el_nino', grade: 4, values: { jja: 1.34, jas: 1.62, aso: 1.95, son: 2.25, ond: 2.45, ndj: 2.39, djf: 2.12, jfm: 1.67, fma: 1.19, mam: 0.69, amj: 0.19, mjj: -0.23 } },
  { season: '2016-2017', startYear: 2016, endYear: 2017, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.46, jas: -0.58, aso: -0.66, son: -0.73, ond: -0.72, ndj: -0.59, djf: -0.42, jfm: -0.23, fma: -0.06, mam: 0.16, amj: 0.28, mjj: 0.26 } },
  { season: '2017-2018', startYear: 2017, endYear: 2018, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: 0.10, jas: -0.14, aso: -0.43, son: -0.73, ond: -0.93, ndj: -1.02, djf: -0.97, jfm: -0.83, fma: -0.64, mam: -0.42, amj: -0.19, mjj: 0.06 } },
  { season: '2018-2019', startYear: 2018, endYear: 2019, ensoType: 'WE', category: 'el_nino', grade: 1, values: { jja: 0.14, jas: 0.15, aso: 0.28, son: 0.50, ond: 0.61, ndj: 0.54, djf: 0.47, jfm: 0.49, fma: 0.49, mam: 0.45, amj: 0.36, mjj: 0.24 } },
  { season: '2019-2020', startYear: 2019, endYear: 2020, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.15, jas: 0.09, aso: 0.12, son: 0.23, ond: 0.38, ndj: 0.42, djf: 0.36, jfm: 0.26, fma: 0.17, mam: 0.05, amj: -0.18, mjj: -0.37 } },
  { season: '2020-2021', startYear: 2020, endYear: 2021, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.45, jas: -0.61, aso: -0.88, son: -1.12, ond: -1.19, ndj: -1.08, djf: -0.95, jfm: -0.83, fma: -0.72, mam: -0.61, amj: -0.47, mjj: -0.36 } },
  { season: '2021-2022', startYear: 2021, endYear: 2022, ensoType: 'ML', category: 'la_nina', grade: 2, values: { jja: -0.35, jas: -0.45, aso: -0.64, son: -0.84, ond: -0.98, ndj: -1.01, djf: -0.98, jfm: -0.95, fma: -0.96, mam: -1.01, amj: -0.97, mjj: -0.85 } },
  { season: '2022-2023', startYear: 2022, endYear: 2023, ensoType: 'WL', category: 'la_nina', grade: 1, values: { jja: -0.74, jas: -0.77, aso: -0.85, son: -0.88, ond: -0.82, ndj: -0.71, djf: -0.59, jfm: -0.47, fma: -0.33, mam: -0.06, amj: 0.25, mjj: 0.54 } },
  { season: '2023-2024', startYear: 2023, endYear: 2024, ensoType: 'SE', category: 'el_nino', grade: 3, values: { jja: 0.77, jas: 0.99, aso: 1.17, son: 1.34, ond: 1.48, ndj: 1.50, djf: 1.36, jfm: 1.11, fma: 0.77, mam: 0.35, amj: -0.04, mjj: -0.36 } },
  { season: '2024-2025', startYear: 2024, endYear: 2025, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.50, jas: -0.52, aso: -0.49, son: -0.45, ond: -0.41, ndj: -0.39, djf: -0.37, jfm: -0.33, fma: -0.19, mam: 0.00, amj: 0.08, mjj: 0.12 } },
  { season: '2025-2026', startYear: 2025, endYear: 2026, ensoType: null, category: 'neutral', grade: null, values: { jja: 0.15, jas: 0.12, aso: 0.10, son: 0.05, ond: -0.02, ndj: -0.08, djf: -0.15, jfm: -0.20, fma: -0.22, mam: -0.20, amj: -0.18, mjj: -0.15 } },
  { season: '2026-2027', startYear: 2026, endYear: 2027, ensoType: null, category: 'neutral', grade: null, values: { jja: -0.10, jas: -0.05, aso: 0.00, son: 0.05, ond: 0.10, ndj: 0.15, djf: 0.20, jfm: 0.25, fma: 0.28, mam: 0.30, amj: 0.30, mjj: 0.28 } },
];

/** Map of RONI records indexed by season start year */
export const RONI_RECORDS_BY_YEAR = new Map<number, IRoniSeasonRecord>(
  RONI_SEASON_RECORDS.map((r) => [r.startYear, r])
);

/**
 * All years classified as El Niño (grades 1-4).
 */
export const EL_NINO_YEARS: number[] = RONI_SEASON_RECORDS
  .filter((r) => r.category === 'el_nino')
  .map((r) => r.startYear);

/**
 * All years classified as La Niña (grades 1-3).
 */
export const LA_NINA_YEARS: number[] = RONI_SEASON_RECORDS
  .filter((r) => r.category === 'la_nina')
  .map((r) => r.startYear);

/** Lookup RONI record by start year */
export function getEnsoSeasonRecord(year: number): IRoniSeasonRecord | undefined {
  return RONI_RECORDS_BY_YEAR.get(year);
}

/**
 * Lookup the 3-month RONI SST anomaly value for a given year and 3-month period code.
 * E.g. getEnso3MonthValue(1982, 'OND') -> 2.43
 */
export function getEnso3MonthValue(year: number, periodCode: string): number | null | undefined {
  const record = RONI_RECORDS_BY_YEAR.get(year);
  if (!record || !periodCode) return undefined;
  const key = periodCode.trim().toLowerCase() as ThreeMonthPeriodKey;
  return Object.prototype.hasOwnProperty.call(record.values, key) ? record.values[key] : undefined;
}

/**
 * Format a RONI SST anomaly value as a string with explicit sign (e.g. "+2.43" or "-1.20").
 * Returns null if the value is null, undefined, or NaN.
 */
export function formatRoniAnomaly(val: number | null | undefined): string | null {
  if (val === null || val === undefined || Number.isNaN(val)) return null;
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}
