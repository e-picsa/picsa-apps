export function filterHashmap<T>(hashmap: Record<string, T>, filterFn: (data: T) => boolean) {
  const filtered: Record<string, T> = {};
  for (const [key, value] of Object.entries(hashmap)) {
    if (filterFn(value)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

export function addHashmapPrefix<T>(data: Record<string, T>, prefix: string) {
  const prefixed: Record<string, T> = {};
  Object.entries(data).forEach(([key, value]) => (prefixed[`${prefix}${key}`] = value));
  return prefixed;
}
