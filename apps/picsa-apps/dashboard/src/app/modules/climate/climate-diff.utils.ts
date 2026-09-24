import type { IChartConfig, IStationData } from '@picsa/models';

import {
  CLIMATE_PRODUCTS,
  IClimateProductDefinition,
  IProductDiffSummary,
  IStationDiffSummary,
  IValueDiff,
  StationDiffStatus,
} from './climate-diff.types';

export { CLIMATE_PRODUCTS };

/**
 * Compare bundled station app data against dashboard database data per climate product.
 */
export function compareStationDatasets(
  stationId: string,
  appData: IStationData[] | null | undefined,
  dbData: IStationData[] | null | undefined,
): IStationDiffSummary {
  const hasAppData = Boolean(appData && appData.length > 0);
  const hasDbData = Boolean(dbData && dbData.length > 0);

  const appMap = new Map<number, IStationData>();
  if (hasAppData && appData) {
    for (const row of appData) {
      if (isValidNumber(row.Year)) {
        appMap.set(row.Year, row);
      }
    }
  }

  const dbMap = new Map<number, IStationData>();
  if (hasDbData && dbData) {
    for (const row of dbData) {
      if (isValidNumber(row.Year)) {
        dbMap.set(row.Year, row);
      }
    }
  }

  const products: Record<string, IProductDiffSummary> = {};
  const allAddedYears = new Set<number>();
  const allRemovedYears = new Set<number>();
  let totalChangedValuesCount = 0;

  for (const product of CLIMATE_PRODUCTS) {
    const summary = compareProduct(product, appMap, dbMap);
    products[product.id] = summary;

    for (const year of summary.yearsAdded) {
      allAddedYears.add(year);
    }
    for (const year of summary.yearsRemoved) {
      allRemovedYears.add(year);
    }
    totalChangedValuesCount += summary.changedCount;
  }

  let status: StationDiffStatus = 'no_data';
  if (!hasAppData && !hasDbData) {
    status = 'no_data';
  } else if (hasAppData && !hasDbData) {
    status = 'app_only';
  } else if (!hasAppData && hasDbData) {
    status = 'db_only';
  } else {
    const hasAnyDiff = allAddedYears.size > 0 || allRemovedYears.size > 0 || totalChangedValuesCount > 0;
    status = hasAnyDiff ? 'diff' : 'in_sync';
  }

  return {
    stationId,
    hasAppData,
    hasDbData,
    status,
    totalYearsAddedCount: allAddedYears.size,
    totalYearsRemovedCount: allRemovedYears.size,
    totalChangedValuesCount,
    products,
  };
}

function compareProduct(
  product: IClimateProductDefinition,
  appMap: Map<number, IStationData>,
  dbMap: Map<number, IStationData>,
): IProductDiffSummary {
  const appYears: number[] = [];
  const dbYears: number[] = [];

  for (const [year, row] of appMap.entries()) {
    if (hasProductData(row, product.keys)) {
      appYears.push(year);
    }
  }
  for (const [year, row] of dbMap.entries()) {
    if (hasProductData(row, product.keys)) {
      dbYears.push(year);
    }
  }

  appYears.sort((a, b) => a - b);
  dbYears.sort((a, b) => a - b);

  const appSet = new Set(appYears);
  const dbSet = new Set(dbYears);

  const yearsAdded = dbYears.filter((y) => !appSet.has(y));
  const yearsRemoved = appYears.filter((y) => !dbSet.has(y));
  const commonYears = dbYears.filter((y) => appSet.has(y));

  const changes: IValueDiff[] = [];

  // 1. Added years (in DB, not App)
  for (const year of yearsAdded) {
    const dbRow = dbMap.get(year);
    for (const key of product.keys) {
      const dbVal = dbRow ? (dbRow[key] as number | undefined) : undefined;
      if (isValidNumber(dbVal)) {
        changes.push({
          year,
          productId: product.id,
          productLabel: product.label,
          field: String(key),
          appValue: null,
          dbValue: roundValue(dbVal),
          diff: null,
          type: 'year_added',
        });
      }
    }
  }

  // 2. Removed years (in App, not DB)
  for (const year of yearsRemoved) {
    const appRow = appMap.get(year);
    for (const key of product.keys) {
      const appVal = appRow ? (appRow[key] as number | undefined) : undefined;
      if (isValidNumber(appVal)) {
        changes.push({
          year,
          productId: product.id,
          productLabel: product.label,
          field: String(key),
          appValue: roundValue(appVal),
          dbValue: null,
          diff: null,
          type: 'year_removed',
        });
      }
    }
  }

  // 3. Changed values for common years
  let changedCount = 0;
  for (const year of commonYears) {
    const appRow = appMap.get(year);
    const dbRow = dbMap.get(year);

    for (const key of product.keys) {
      const appVal = appRow ? (appRow[key] as number | undefined) : undefined;
      const dbVal = dbRow ? (dbRow[key] as number | undefined) : undefined;

      const appValid = isValidNumber(appVal);
      const dbValid = isValidNumber(dbVal);

      if (appValid && dbValid) {
        const delta = dbVal - appVal;
        // Compare with tolerance to avoid floating-point inaccuracy
        if (Math.abs(delta) > 0.05) {
          changedCount++;
          changes.push({
            year,
            productId: product.id,
            productLabel: product.label,
            field: String(key),
            appValue: roundValue(appVal),
            dbValue: roundValue(dbVal),
            diff: roundValue(delta),
            type: 'value_changed',
          });
        }
      } else if (appValid && !dbValid) {
        changedCount++;
        changes.push({
          year,
          productId: product.id,
          productLabel: product.label,
          field: String(key),
          appValue: roundValue(appVal),
          dbValue: null,
          diff: null,
          type: 'value_changed',
        });
      } else if (!appValid && dbValid) {
        changedCount++;
        changes.push({
          year,
          productId: product.id,
          productLabel: product.label,
          field: String(key),
          appValue: null,
          dbValue: roundValue(dbVal),
          diff: null,
          type: 'value_changed',
        });
      }
    }
  }

  // Sort all change records chronologically
  changes.sort((a, b) => a.year - b.year);

  const hasData = appYears.length > 0 || dbYears.length > 0;
  const isInSync = hasData && yearsAdded.length === 0 && yearsRemoved.length === 0 && changedCount === 0;

  return {
    productId: product.id,
    label: product.label,
    units: product.units,
    yearsAdded,
    yearsRemoved,
    changedCount,
    changes,
    appYearSpan: appYears.length > 0 ? [appYears[0], appYears[appYears.length - 1]] : null,
    dbYearSpan: dbYears.length > 0 ? [dbYears[0], dbYears[dbYears.length - 1]] : null,
    hasData,
    isInSync,
  };
}

function hasProductData(row: IStationData, keys: (keyof IStationData)[]): boolean {
  return keys.some((k) => isValidNumber(row[k] as number | undefined));
}

function isValidNumber(val: number | null | undefined): val is number {
  return typeof val === 'number' && !Number.isNaN(val);
}

function roundValue(val: number): number;
function roundValue(val: number | null | undefined): number | null;
function roundValue(val: number | null | undefined): number | null {
  if (typeof val !== 'number' || Number.isNaN(val)) {
    return null;
  }
  return Math.round(val * 100) / 100;
}

const FIELD_LABELS: Record<string, string> = {
  Rainfall: 'Rainfall',
  Start: 'Start',
  End: 'End',
  Length: 'Length',
  mean_tmin: 'Mean Min',
  min_tmin: 'Lowest Min',
  mean_tmax: 'Mean Max',
  max_tmax: 'Highest Max',
  Extreme_events: 'Extreme Events',
};

/**
 * Generate c3 chart configuration that overlays DB Data and App Data for a given product.
 */
export function generateDiffChartConfig(
  appData: IStationData[] | null | undefined,
  dbData: IStationData[] | null | undefined,
  product: IClimateProductDefinition,
): IChartConfig {
  const appMap = new Map<number, IStationData>();
  if (appData) {
    for (const row of appData) {
      if (isValidNumber(row.Year)) {
        appMap.set(row.Year, row);
      }
    }
  }

  const dbMap = new Map<number, IStationData>();
  if (dbData) {
    for (const row of dbData) {
      if (isValidNumber(row.Year)) {
        dbMap.set(row.Year, row);
      }
    }
  }

  const allYears = Array.from(new Set([...appMap.keys(), ...dbMap.keys()])).sort((a, b) => a - b);

  if (allYears.length === 0) {
    return {
      data: {
        json: [],
      },
    };
  }

  const mergedRows: Record<string, any>[] = [];
  for (const year of allYears) {
    const appRow = appMap.get(year);
    const dbRow = dbMap.get(year);
    const entry: Record<string, any> = { Year: year };

    for (const key of product.keys) {
      const dbVal = dbRow ? (dbRow[key] as number | undefined) : undefined;
      const appVal = appRow ? (appRow[key] as number | undefined) : undefined;
      entry[`${key}_db`] = isValidNumber(dbVal) ? dbVal : null;
      entry[`${key}_app`] = isValidNumber(appVal) ? appVal : null;
    }
    mergedRows.push(entry);
  }

  const valueKeys: string[] = [];
  const names: Record<string, string> = {};
  const colors: Record<string, string> = {};

  const singleKey = product.keys.length === 1;

  for (let i = 0; i < product.keys.length; i++) {
    const key = product.keys[i];
    const keyDb = `${key}_db`;
    const keyApp = `${key}_app`;

    valueKeys.push(keyDb, keyApp);

    if (singleKey) {
      names[keyDb] = 'Data System';
      names[keyApp] = 'App Data';
      colors[keyDb] = '#1976d2'; // Solid primary blue
      colors[keyApp] = '#e65100'; // Vibrant deep orange
    } else {
      const fieldName = FIELD_LABELS[key] || String(key);
      names[keyDb] = `${fieldName} (Data System)`;
      names[keyApp] = `${fieldName} (App)`;
      if (i === 0) {
        colors[keyDb] = '#1976d2';
        colors[keyApp] = '#e65100';
      } else {
        colors[keyDb] = '#0288d1';
        colors[keyApp] = '#f57c00';
      }
    }
  }

  const config: IChartConfig = {
    data: {
      json: mergedRows as any,
      keys: {
        value: [...valueKeys, 'Year'],
      },
      names,
      x: 'Year',
      colors,
      types: Object.fromEntries(valueKeys.map((k) => [k, 'line'])),
    },
    legend: {
      show: true,
      position: 'bottom',
    },
    grid: {
      x: { show: true },
      y: { show: true },
    },
    point: {
      r: 3,
      focus: {
        expand: {
          r: 5,
        },
      },
    },
    axis: {
      x: {
        label: {
          text: 'Year',
          position: 'outer-center',
        },
        tick: {
          rotate: 45,
          multiline: false,
          fit: true,
        },
      },
      y: {
        label: {
          text: `${product.label} (${product.units})`,
          position: 'outer-middle',
        },
        tick: {
          format: (val: any) => `${val} ${product.units}`,
        },
      },
    },
    tooltip: {
      grouped: true,
      format: {
        title: (x: any) => `Year: ${x}`,
        value: (value: any) => {
          if (isValidNumber(value)) {
            return `${value} ${product.units}`;
          }
          return 'No data';
        },
      },
    },
  };

  return config;
}
