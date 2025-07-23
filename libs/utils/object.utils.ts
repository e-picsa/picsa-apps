/**
 * Determine whether a value is a literal object type (`{}`)
 * Adapted from discussion https://stackoverflow.com/q/1173549
 */
export function isObjectLiteral(v: any) {
  return v ? v.constructor === {}.constructor : false;
}

/** Check if an object is either empty or contains only empty child */
export function isEmptyObjectDeep(v: any) {
  return isObjectLiteral(v) && Object.values(v).every((x) => isEmptyObjectDeep(x));
}

/** Minimal deep equality checker, loosely based on lodash _isEqual but for simple primitives only */
export function isEqual<T extends Record<string, any>>(a = {} as T, b = {} as T) {
  // handle simple string, boolean, number, undefined, null or same object reference
  if (a === b) return true;
  // handle different object types
  if (typeof a !== typeof b) return false;
  // handle deep comparison for arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // find the first element index where there is a mismatch
    // if all elements are the same `findIndex` returns value -1
    const differentIndex = a.findIndex((v, i) => !isEqual(v, b[i]));
    return differentIndex === -1;
  }
  // handle deep comparison for literal objects
  if (isObjectLiteral(a) && isObjectLiteral(b)) {
    // assert if equal if same properties but in different order
    const aSorted = sortJsonKeys(a);
    const bSorted = sortJsonKeys(b);
    if (!isEqual(Object.keys(aSorted), Object.keys(bSorted))) return false;
    return isEqual(Object.values(aSorted), Object.values(bSorted));
  }
  // NOTE - does not compare symbols, date objects, functions, buffers etc.
  return false;
}

/** Order a nested json object literal in alphabetical key order */
export const sortJsonKeys = <T extends Record<string, any>>(json: T, caseSensitive = true): T => {
  // return non json-type data as-is
  if (!isObjectLiteral(json)) {
    return json;
  }
  const caseSensitiveSort = (a: string, b: string) => (a > b ? 1 : -1);
  const caseInsensitiveSort = (a: string, b: string) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1);

  // recursively sort any nested json by key
  return Object.keys(json)
    .sort(caseSensitive ? caseSensitiveSort : caseInsensitiveSort)
    .reduce((obj, key) => {
      obj[key] = sortJsonKeys(json[key]);
      return obj;
    }, {}) as T;
};

export const objectDiff = <T extends Record<string, any>>(before = {} as T, after = {} as T) => {
  const diff: Record<string, { before: any; after: any }> = {};

  // record diff comparing all after entries with before
  for (const key of Object.keys(after)) {
    if (!isEqual(before[key], after[key])) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }

  // include case where keys removed from before
  for (const key of Object.keys(before)) {
    if (!(key in after)) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }

  return diff;
};
