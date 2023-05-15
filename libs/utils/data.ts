/**
 * Convert an object array into a json object, with keys corresponding to array entries
 * @param keyfield any unique field which all array objects contain to use as hash keys (e.g. 'id')
 */
export function arrayToHashmap<T extends object>(arr: T[], keyfield: keyof T) {
  const hashmap: Record<string, T> = {};
  if (!Array.isArray(arr)) {
    console.error('Cannot convert array to hashmap, not an array', {
      arr,
      keyfield,
    });
    return {};
  }
  for (const el of arr) {
    if (el.hasOwnProperty(keyfield)) {
      hashmap[el[keyfield as string]] = el;
    }
  }
  return hashmap;
}

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
