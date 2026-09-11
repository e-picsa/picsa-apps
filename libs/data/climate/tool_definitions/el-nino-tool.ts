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

/**
 * 3-month running period headings in the RONI dataset from June-July-August (JJA)
 * to May-June-July (MJJ) of the following year.
 */
export const RONI_PERIOD_HEADINGS = [
  'JJA',
  'JAS',
  'ASO',
  'SON',
  'OND',
  'NDJ',
  'DJF',
  'JFM',
  'FMA',
  'MAM',
  'AMJ',
  'MJJ',
] as const;

export type RoniPeriodHeading = (typeof RONI_PERIOD_HEADINGS)[number];

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
  startYear: number; // e.g. 1957
  endYear: number; // e.g. 1958
  ensoType: EnsoType;
  category: EnsoCategory;
  grade: EnsoGrade | null;
  values: readonly (number | null)[];
}

export interface IEnsoStyleConfig {
  color: string;
  stroke: string;
  size: number;
}

export interface IEnsoDefinitionConfig {
  grade: EnsoGrade;
  label: string;
  code: string;
  threshold: string;
  defaultActive?: boolean;
}

export interface IEnsoGradeConfig extends IEnsoStyleConfig, IEnsoDefinitionConfig {}

export const EL_NINO_STYLES: Record<EnsoGrade, IEnsoStyleConfig> = {
  1: { color: '#fed8a6', stroke: '#d97f26', size: 4.5 },
  2: { color: '#f59338', stroke: '#bf5c0a', size: 7.5 },
  3: { color: '#c44601', stroke: '#943200', size: 10.0 },
  4: { color: '#8c1b07', stroke: '#5e1003', size: 12.5 },
};

export const LA_NINA_STYLES: Record<1 | 2 | 3, IEnsoStyleConfig> = {
  1: { color: '#bae0fd', stroke: '#4a94d8', size: 4.5 },
  2: { color: '#348be8', stroke: '#1c62a8', size: 7.5 },
  3: { color: '#0e457b', stroke: '#082a4d', size: 11.0 },
};

export const EL_NINO_DEFINITIONS: Record<EnsoGrade, IEnsoDefinitionConfig> = {
  1: { grade: 1, label: 'Weak', code: 'WE', threshold: '+0.5 to +0.9', defaultActive: false },
  2: { grade: 2, label: 'Moderate', code: 'ME', threshold: '+1.0 to +1.4', defaultActive: true },
  3: { grade: 3, label: 'Strong', code: 'SE', threshold: '+1.5 to +1.9', defaultActive: true },
  4: { grade: 4, label: 'Very Strong', code: 'VSE', threshold: '≥ +2.0', defaultActive: true },
};

export const LA_NINA_DEFINITIONS: Record<1 | 2 | 3, IEnsoDefinitionConfig> = {
  1: { grade: 1, label: 'Weak', code: 'WL', threshold: '-0.5 to -0.9', defaultActive: false },
  2: { grade: 2, label: 'Moderate', code: 'ML', threshold: '-1.0 to -1.4', defaultActive: true },
  3: { grade: 3, label: 'Strong', code: 'SL', threshold: '≤ -1.5', defaultActive: true },
};

/** El Niño gradings 1 to 4: lighter to darker shades of orange/red and growing sizes */
export const EL_NINO_GRADES: Record<EnsoGrade, IEnsoGradeConfig> = {
  1: { ...EL_NINO_DEFINITIONS[1], ...EL_NINO_STYLES[1] },
  2: { ...EL_NINO_DEFINITIONS[2], ...EL_NINO_STYLES[2] },
  3: { ...EL_NINO_DEFINITIONS[3], ...EL_NINO_STYLES[3] },
  4: { ...EL_NINO_DEFINITIONS[4], ...EL_NINO_STYLES[4] },
};

/** La Niña gradings 1 to 3: lighter to darker shades of blue and growing sizes */
export const LA_NINA_GRADES: Record<1 | 2 | 3, IEnsoGradeConfig> = {
  1: { ...LA_NINA_DEFINITIONS[1], ...LA_NINA_STYLES[1] },
  2: { ...LA_NINA_DEFINITIONS[2], ...LA_NINA_STYLES[2] },
  3: { ...LA_NINA_DEFINITIONS[3], ...LA_NINA_STYLES[3] },
};

/**
 * Digitised Relative Oceanic Niño Index (RONI) 1949-1950 through 2026-2027.
 * Running 3-month mean SST anomaly for the Niño 3.4 region minus tropical average SSTA.
 * Values correspond to the periods defined in RONI_PERIOD_HEADINGS (JJA -> MJJ).
 */
export const RONI_SEASON_RECORDS: IRoniSeasonRecord[] = [
  {
    startYear: 1949,
    endYear: 1950,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [null, null, null, null, null, null, -1.47, -1.27, -1.11, -1.09, -1.0, -0.71],
  },
  {
    startYear: 1950,
    endYear: 1951,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.41, -0.24, -0.22, -0.29, -0.41, -0.56, -0.5, -0.17, 0.25, 0.6, 0.64, 0.69],
  },
  {
    startYear: 1951,
    endYear: 1952,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.68, 0.81, 0.87, 0.98, 0.91, 0.8, 0.58, 0.44, 0.42, 0.44, 0.31, 0.07],
  },
  {
    startYear: 1952,
    endYear: 1953,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [-0.04, 0.03, 0.13, 0.01, -0.01, 0.2, 0.53, 0.76, 0.77, 0.83, 0.84, 0.79],
  },
  {
    startYear: 1953,
    endYear: 1954,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.67, 0.66, 0.7, 0.77, 0.81, 0.93, 0.99, 0.73, 0.14, -0.2, -0.34, -0.26],
  },
  {
    startYear: 1954,
    endYear: 1955,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.49, -0.74, -0.85, -0.7, -0.56, -0.41, -0.38, -0.32, -0.35, -0.39, -0.37, -0.36],
  },
  {
    startYear: 1955,
    endYear: 1956,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.44, -0.61, -1.02, -1.43, -1.63, -1.27, -0.75, -0.32, -0.2, -0.06, -0.05, -0.08],
  },
  {
    startYear: 1956,
    endYear: 1957,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.28, -0.32, -0.31, -0.33, -0.37, -0.25, 0.04, 0.41, 0.73, 0.97, 1.1, 1.18],
  },
  {
    startYear: 1957,
    endYear: 1958,
    ensoType: 'SE',
    category: 'el_nino',
    grade: 3,
    values: [1.23, 1.26, 1.23, 1.31, 1.52, 1.87, 2.02, 1.88, 1.4, 1.07, 0.83, 0.68],
  },
  {
    startYear: 1958,
    endYear: 1959,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.49, 0.26, 0.18, 0.25, 0.39, 0.68, 0.77, 0.84, 0.66, 0.44, 0.25, -0.06],
  },
  {
    startYear: 1959,
    endYear: 1960,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.23, -0.4, -0.29, -0.26, -0.11, -0.02, 0.03, 0.04, 0.0, 0.08, 0.06, 0.04],
  },
  {
    startYear: 1960,
    endYear: 1961,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.11, 0.17, 0.17, 0.07, 0.01, 0.02, 0.05, 0.06, 0.03, 0.1, 0.26, 0.34],
  },
  {
    startYear: 1961,
    endYear: 1962,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.2, -0.09, -0.32, -0.31, -0.24, -0.12, -0.13, -0.09, -0.11, -0.22, -0.26, -0.21],
  },
  {
    startYear: 1962,
    endYear: 1963,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.11, -0.18, -0.25, -0.4, -0.46, -0.5, -0.38, -0.1, 0.17, 0.24, 0.23, 0.41],
  },
  {
    startYear: 1963,
    endYear: 1964,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.73, 0.99, 1.04, 1.1, 1.22, 1.25, 1.13, 0.68, 0.1, -0.37, -0.63, -0.59],
  },
  {
    startYear: 1964,
    endYear: 1965,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.59, -0.62, -0.72, -0.76, -0.7, -0.51, -0.25, 0.07, 0.15, 0.37, 0.62, 1.03],
  },
  {
    startYear: 1965,
    endYear: 1966,
    ensoType: 'SE',
    category: 'el_nino',
    grade: 3,
    values: [1.38, 1.67, 1.94, 2.03, 2.04, 1.9, 1.65, 1.52, 1.26, 0.87, 0.46, 0.29],
  },
  {
    startYear: 1966,
    endYear: 1967,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.27, 0.13, -0.02, -0.07, -0.12, -0.17, -0.17, -0.2, -0.39, -0.4, -0.19, 0.18],
  },
  {
    startYear: 1967,
    endYear: 1968,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.3, 0.1, -0.02, -0.08, 0.01, -0.02, -0.21, -0.33, -0.31, -0.19, 0.16, 0.45],
  },
  {
    startYear: 1968,
    endYear: 1969,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.69, 0.58, 0.45, 0.55, 0.77, 1.06, 1.24, 1.13, 0.85, 0.54, 0.35, 0.23],
  },
  {
    startYear: 1969,
    endYear: 1970,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.23, 0.43, 0.72, 0.78, 0.74, 0.57, 0.51, 0.31, 0.25, 0.11, 0.01, -0.29],
  },
  {
    startYear: 1970,
    endYear: 1971,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.58, -0.69, -0.69, -0.63, -0.7, -0.91, -1.03, -1.02, -0.83, -0.6, -0.48, -0.41],
  },
  {
    startYear: 1971,
    endYear: 1972,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.44, -0.44, -0.47, -0.48, -0.52, -0.47, -0.31, 0.02, 0.41, 0.77, 0.94, 1.12],
  },
  {
    startYear: 1972,
    endYear: 1973,
    ensoType: 'SE',
    category: 'el_nino',
    grade: 3,
    values: [1.27, 1.49, 1.7, 1.96, 2.21, 2.27, 2.02, 1.4, 0.56, -0.25, -0.76, -1.06],
  },
  {
    startYear: 1973,
    endYear: 1974,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-1.24, -1.4, -1.54, -1.8, -1.95, -1.88, -1.54, -1.19, -0.95, -0.86, -0.79, -0.64],
  },
  {
    startYear: 1974,
    endYear: 1975,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.37, -0.19, -0.18, -0.36, -0.45, -0.25, -0.08, -0.13, -0.32, -0.47, -0.61, -0.78],
  },
  {
    startYear: 1975,
    endYear: 1976,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-0.91, -0.94, -1.05, -1.03, -1.08, -1.12, -1.03, -0.65, -0.3, -0.11, 0.0, 0.23],
  },
  {
    startYear: 1976,
    endYear: 1977,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.46, 0.67, 0.94, 1.1, 1.13, 1.13, 1.01, 0.93, 0.52, 0.31, 0.19, 0.35],
  },
  {
    startYear: 1977,
    endYear: 1978,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.42, 0.58, 0.78, 0.97, 1.09, 1.05, 0.94, 0.6, 0.13, -0.18, -0.36, -0.29],
  },
  {
    startYear: 1978,
    endYear: 1979,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.32, -0.28, -0.2, -0.05, 0.15, 0.17, 0.17, 0.15, 0.21, 0.2, 0.08, -0.08],
  },
  {
    startYear: 1979,
    endYear: 1980,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [-0.02, 0.2, 0.39, 0.49, 0.54, 0.66, 0.64, 0.47, 0.27, 0.21, 0.31, 0.33],
  },
  {
    startYear: 1980,
    endYear: 1981,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.19, 0.01, -0.04, 0.06, 0.2, 0.17, 0.01, -0.27, -0.34, -0.34, -0.26, -0.3],
  },
  {
    startYear: 1981,
    endYear: 1982,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.26, -0.18, -0.12, -0.16, -0.19, 0.01, 0.14, 0.33, 0.4, 0.64, 0.77, 0.82],
  },
  {
    startYear: 1982,
    endYear: 1983,
    ensoType: 'VSE',
    category: 'el_nino',
    grade: 4,
    values: [0.92, 1.25, 1.81, 2.21, 2.43, 2.52, 2.49, 2.2, 1.71, 1.37, 1.0, 0.57],
  },
  {
    startYear: 1983,
    endYear: 1984,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [0.1, -0.24, -0.59, -0.94, -1.14, -0.96, -0.54, -0.35, -0.35, -0.52, -0.57, -0.43],
  },
  {
    startYear: 1984,
    endYear: 1985,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.23, -0.07, -0.15, -0.51, -0.83, -1.0, -0.82, -0.6, -0.61, -0.69, -0.72, -0.54],
  },
  {
    startYear: 1985,
    endYear: 1986,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.36, -0.31, -0.22, -0.18, -0.09, -0.17, -0.34, -0.33, -0.21, -0.12, -0.1, -0.06],
  },
  {
    startYear: 1986,
    endYear: 1987,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.26, 0.58, 0.91, 1.15, 1.36, 1.49, 1.56, 1.48, 1.26, 0.97, 0.89, 1.05],
  },
  {
    startYear: 1987,
    endYear: 1988,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [1.34, 1.55, 1.48, 1.27, 1.02, 0.92, 0.65, 0.3, -0.21, -0.75, -1.37, -1.75],
  },
  {
    startYear: 1988,
    endYear: 1989,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-1.64, -1.32, -1.36, -1.63, -1.94, -1.92, -1.7, -1.42, -1.1, -0.85, -0.6, -0.43],
  },
  {
    startYear: 1989,
    endYear: 1990,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.35, -0.3, -0.24, -0.22, -0.15, 0.03, 0.24, 0.29, 0.27, 0.25, 0.21, 0.22],
  },
  {
    startYear: 1990,
    endYear: 1991,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.27, 0.37, 0.4, 0.35, 0.39, 0.5, 0.6, 0.5, 0.4, 0.35, 0.5, 0.67],
  },
  {
    startYear: 1991,
    endYear: 1992,
    ensoType: 'VSE',
    category: 'el_nino',
    grade: 4,
    values: [0.81, 0.8, 0.91, 1.17, 1.7, 2.08, 2.32, 2.24, 2.04, 1.73, 1.35, 0.9],
  },
  {
    startYear: 1992,
    endYear: 1993,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.54, 0.32, 0.15, 0.07, 0.08, 0.26, 0.5, 0.69, 0.87, 0.97, 0.9, 0.72],
  },
  {
    startYear: 1993,
    endYear: 1994,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.49, 0.51, 0.46, 0.36, 0.28, 0.27, 0.32, 0.33, 0.43, 0.54, 0.64, 0.64],
  },
  {
    startYear: 1994,
    endYear: 1995,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.74, 0.81, 0.95, 1.11, 1.34, 1.43, 1.27, 0.95, 0.68, 0.37, 0.1, -0.13],
  },
  {
    startYear: 1995,
    endYear: 1996,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.32, -0.53, -0.74, -0.91, -0.95, -0.94, -0.87, -0.77, -0.62, -0.39, -0.3, -0.29],
  },
  {
    startYear: 1996,
    endYear: 1997,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.24, -0.24, -0.23, -0.27, -0.3, -0.29, -0.25, -0.1, 0.17, 0.52, 0.95, 1.34],
  },
  {
    startYear: 1997,
    endYear: 1998,
    ensoType: 'VSE',
    category: 'el_nino',
    grade: 4,
    values: [1.69, 2.01, 2.25, 2.38, 2.36, 2.34, 2.16, 1.82, 1.25, 0.77, 0.14, -0.5],
  },
  {
    startYear: 1998,
    endYear: 1999,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-1.17, -1.41, -1.52, -1.52, -1.63, -1.65, -1.55, -1.28, -1.09, -1.0, -1.01, -0.99],
  },
  {
    startYear: 1999,
    endYear: 2000,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-0.99, -0.96, -0.97, -1.11, -1.38, -1.62, -1.67, -1.4, -1.09, -0.78, -0.63, -0.5],
  },
  {
    startYear: 2000,
    endYear: 2001,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.38, -0.37, -0.45, -0.58, -0.69, -0.68, -0.63, -0.55, -0.53, -0.46, -0.34, -0.13],
  },
  {
    startYear: 2001,
    endYear: 2002,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.01, 0.0, -0.05, -0.17, -0.25, -0.27, -0.14, -0.03, 0.01, 0.11, 0.37, 0.66],
  },
  {
    startYear: 2002,
    endYear: 2003,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.9, 1.08, 1.26, 1.44, 1.47, 1.19, 0.85, 0.49, 0.22, -0.23, -0.43, -0.29],
  },
  {
    startYear: 2003,
    endYear: 2004,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.01, 0.16, 0.19, 0.22, 0.32, 0.29, 0.25, 0.14, 0.11, 0.16, 0.25, 0.45],
  },
  {
    startYear: 2004,
    endYear: 2005,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.66, 0.82, 0.86, 0.77, 0.73, 0.67, 0.55, 0.43, 0.31, 0.31, 0.2, 0.03],
  },
  {
    startYear: 2005,
    endYear: 2006,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.1, -0.12, -0.02, -0.18, -0.5, -0.85, -0.93, -0.88, -0.65, -0.42, -0.14, -0.03],
  },
  {
    startYear: 2006,
    endYear: 2007,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.11, 0.31, 0.54, 0.75, 0.94, 0.92, 0.6, 0.16, -0.18, -0.36, -0.44, -0.53],
  },
  {
    startYear: 2007,
    endYear: 2008,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-0.59, -0.81, -1.05, -1.29, -1.41, -1.51, -1.6, -1.49, -1.26, -0.95, -0.76, -0.5],
  },
  {
    startYear: 2008,
    endYear: 2009,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.29, -0.21, -0.28, -0.4, -0.6, -0.79, -0.9, -0.85, -0.67, -0.42, -0.11, 0.13],
  },
  {
    startYear: 2009,
    endYear: 2010,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.25, 0.39, 0.56, 0.94, 1.34, 1.56, 1.45, 1.11, 0.64, 0.05, -0.53, -0.99],
  },
  {
    startYear: 2010,
    endYear: 2011,
    ensoType: 'SL',
    category: 'la_nina',
    grade: 3,
    values: [-1.28, -1.51, -1.68, -1.74, -1.72, -1.63, -1.43, -1.19, -0.92, -0.69, -0.48, -0.34],
  },
  {
    startYear: 2011,
    endYear: 2012,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.38, -0.51, -0.74, -0.94, -1.05, -0.99, -0.82, -0.65, -0.56, -0.47, -0.27, 0.03],
  },
  {
    startYear: 2012,
    endYear: 2013,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.34, 0.43, 0.4, 0.23, -0.06, -0.38, -0.63, -0.6, -0.5, -0.43, -0.44, -0.43],
  },
  {
    startYear: 2013,
    endYear: 2014,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [-0.38, -0.32, -0.28, -0.22, -0.22, -0.33, -0.49, -0.53, -0.33, -0.05, 0.07, -0.01],
  },
  {
    startYear: 2014,
    endYear: 2015,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [-0.13, -0.09, 0.08, 0.36, 0.52, 0.56, 0.45, 0.38, 0.45, 0.61, 0.82, 1.03],
  },
  {
    startYear: 2015,
    endYear: 2016,
    ensoType: 'VSE',
    category: 'el_nino',
    grade: 4,
    values: [1.33, 1.64, 1.93, 2.18, 2.34, 2.37, 2.22, 1.84, 1.28, 0.54, -0.06, -0.56],
  },
  {
    startYear: 2016,
    endYear: 2017,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.86, -1.0, -1.07, -1.11, -1.08, -0.99, -0.74, -0.54, -0.27, -0.09, 0.05, 0.05],
  },
  {
    startYear: 2017,
    endYear: 2018,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.17, -0.46, -0.73, -0.99, -1.15, -1.26, -1.12, -1.04, -0.88, -0.67, -0.31, -0.04],
  },
  {
    startYear: 2018,
    endYear: 2019,
    ensoType: 'WE',
    category: 'el_nino',
    grade: 1,
    values: [0.05, 0.16, 0.4, 0.65, 0.77, 0.67, 0.62, 0.62, 0.6, 0.52, 0.34, 0.21],
  },
  {
    startYear: 2019,
    endYear: 2020,
    ensoType: null,
    category: 'neutral',
    grade: null,
    values: [0.03, -0.1, -0.03, 0.12, 0.23, 0.2, 0.11, 0.08, -0.03, -0.28, -0.56, -0.76],
  },
  {
    startYear: 2020,
    endYear: 2021,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.81, -0.93, -1.23, -1.47, -1.54, -1.37, -1.18, -1.04, -0.98, -0.79, -0.61, -0.52],
  },
  {
    startYear: 2021,
    endYear: 2022,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.59, -0.72, -0.92, -1.06, -1.23, -1.24, -1.22, -1.22, -1.28, -1.34, -1.22, -0.99],
  },
  {
    startYear: 2022,
    endYear: 2023,
    ensoType: 'ML',
    category: 'la_nina',
    grade: 2,
    values: [-0.91, -1.01, -1.14, -1.12, -1.05, -0.97, -0.83, -0.62, -0.44, -0.21, 0.07, 0.37],
  },
  {
    startYear: 2023,
    endYear: 2024,
    ensoType: 'ME',
    category: 'el_nino',
    grade: 2,
    values: [0.62, 0.85, 1.1, 1.35, 1.49, 1.45, 1.2, 0.85, 0.49, 0.05, -0.26, -0.46],
  },
  {
    startYear: 2024,
    endYear: 2025,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.51, -0.64, -0.76, -0.82, -0.94, -1.08, -1.13, -0.9, -0.67, -0.52, -0.49, -0.43],
  },
  {
    startYear: 2025,
    endYear: 2026,
    ensoType: 'WL',
    category: 'la_nina',
    grade: 1,
    values: [-0.47, -0.63, -0.77, -0.87, -0.93, -0.97, -0.91, -0.76, -0.44, -0.04, 0.49, 0.97],
  },
  {
    startYear: 2026,
    endYear: 2027,
    ensoType: 'SE',
    category: 'el_nino',
    grade: 3,
    values: [1.36, null, null, null, null, null, null, null, null, null, null, null],
  },
];

/** Map of RONI records indexed by season start year */
export const RONI_RECORDS_BY_YEAR = new Map<number, IRoniSeasonRecord>(
  RONI_SEASON_RECORDS.map((r) => [r.startYear, r]),
);

/**
 * All years classified as El Niño (grades 1-4).
 */
export const EL_NINO_YEARS: number[] = RONI_SEASON_RECORDS.filter((r) => r.category === 'el_nino').map(
  (r) => r.startYear,
);

/**
 * All years classified as La Niña (grades 1-3).
 */
export const LA_NINA_YEARS: number[] = RONI_SEASON_RECORDS.filter((r) => r.category === 'la_nina').map(
  (r) => r.startYear,
);

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
  const normalized = periodCode.trim().toUpperCase() as RoniPeriodHeading;
  const idx = RONI_PERIOD_HEADINGS.indexOf(normalized);
  return idx !== -1 ? record.values[idx] : undefined;
}

/**
 * Format a RONI SST anomaly value as a string with explicit sign (e.g. "+2.43" or "-1.20").
 * Returns null if the value is null, undefined, or NaN.
 */
export function formatRoniAnomaly(val: number | null | undefined): string | null {
  if (val === null || val === undefined || Number.isNaN(val)) return null;
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}
