import { createBlobFromBase64 } from 'rxdb';
import { ParseLocalConfig, ParseRemoteConfig, parse as parseCSV } from 'papaparse';

/**
 * Convert an object array into a json object, with keys corresponding to array entries
 * @param keyfield any unique field which all array objects contain to use as hash keys (e.g. 'id')
 * @param keyAccessor alternative function to access key from element data (instead of using keyfield)
 */
export function arrayToHashmap<T extends object>(arr: T[], keyfield: keyof T, keyAccessor?: (el: T) => string) {
  const hashmap: Record<string, T> = {};
  if (!Array.isArray(arr)) {
    console.error('Cannot convert array to hashmap, not an array', {
      arr,
      keyfield,
    });
    return {};
  }
  for (const el of arr) {
    const hashmapKey = keyAccessor ? keyAccessor(el) : el[keyfield];
    if (typeof hashmapKey === 'string') {
      hashmap[hashmapKey] = el;
    }
  }
  return hashmap;
}

/**
 * Convert hashmap object to array
 * @param hashmap
 * @param keyfield field to populate with key from hashmap
 */
export function hashmapToArray<T>(hashmap: Record<string, T>, keyfield: keyof T) {
  if (hashmap.constructor !== {}.constructor) {
    console.error('Cannot convert hashmap to array, not a hashmap', {
      hashmap,
      keyfield,
    });
    return [];
  }
  return Object.entries(hashmap).map(([key, value]) => {
    value[keyfield as any] = key;
    return value;
  });
}

/** Convert an array into an object grouped by specific key */
export function arrayToHashmapArray<T>(arr: T[], keyfield: keyof T) {
  const hashmap: Record<string, T[]> = {} as any;
  if (!Array.isArray(arr)) {
    console.error('Cannot convert non-array to hashmap', { arr, keyfield });
    return {};
  }

  for (const el of arr) {
    const hashKey = el[keyfield] as string;
    if (!(hashKey in hashmap)) {
      hashmap[hashKey] = [];
    }
    hashmap[hashKey].push(el);
  }
  return hashmap;
}

export function mergeArraysByKey<T = Record<string, any>, U = Record<string, any>>(
  arr1: T[],
  arr2: U[],
  key: keyof (T & U),
): Array<T & U> {
  const map = new Map<any, T & U>();

  for (const obj of arr1) {
    map.set(obj[key as string], { ...obj } as any);
  }

  for (const obj of arr2) {
    const k = obj[key as string];
    if (map.has(k)) {
      map.set(k, { ...map.get(k)!, ...obj });
    } else {
      map.set(k, { ...obj } as any);
    }
  }

  return Array.from(map.values());
}

/**
 * Retrieve a nested property from a json object
 * using a single path string accessor
 * (modified from https://gist.github.com/jasonrhodes/2321581)
 *
 * @returns value if exists, or null otherwise
 *
 * @example
 * const obj = {"a":{"b":{"c":1}}}
 * jsonNestedProperty(obj,'a.b.c')  // returns 1
 * jsonNestedProperty(obj,'a.b.c.d')  // returns null
 *
 * @param obj data object to iterate over
 * @param nestedPath property path, such as data.subfield1.deeperfield2
 */
export function jsonNestedProperty<T>(obj: any, nestedPath: string) {
  return nestedPath.split('.').reduce((prev, current) => {
    return prev ? prev[current] : null;
  }, obj) as T;
}

export function base64ToBlob(base64String, mimetype: string) {
  return createBlobFromBase64(base64String, mimetype);
}

/** Capitalise the first letter of a string */
export function capitalise(str: string) {
  if (typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Load data from csv
 * @param ref - CSV reference data
 * If downloading from remote source (on web) should include {download: true} in config
 * On node remote content will need to be downloaded first and passed as csvString instead
 */
export function loadCSV<T>(ref: string, config: Partial<ParseRemoteConfig | ParseLocalConfig>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    parseCSV(ref as any, {
      complete: (res) => {
        resolve(res.data as T[]);
      },
      error: function (err) {
        console.error('Could not parse CSV', ref, err.message);
        resolve([]);
      },
      ...config,
    });
  });
}

/** Convert json to csv  (adapted from https://stackoverflow.com/a/31536517) */
export function jsonToCSV(data: any[], headers?: string[]) {
  if (data.length === 0) return '';
  // generate headers from first row of data if not provided
  if (!headers) {
    headers = Object.keys(data[0]);
  }
  const csv = [
    headers.join(','), // header row first
    ...data.map((row) => headers.map((fieldName) => valueCSV(row[fieldName])).join(',')),
  ].join('\r\n');
  return csv;
}

/** Convert value for csv output. Stringifies json, converts array to string with custom escape */
function valueCSV(v: any) {
  if (typeof v === 'string') {
    v = v.replace(/"/g, '');
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    return `"[${escapeCSVArray(v)}]"`;
  }
  return JSON.stringify(v);
}

function escapeCSVArray(arr: any[]) {
  return arr
    .map((el) => {
      if (typeof el === 'string') {
        return `""${el}""`;
      }
      // handle nested array of arrays
      if (Array.isArray(el)) {
        return `[${escapeCSVArray(el)}]`;
      }
      return `${el}`;
    })
    .join(',');
}
