/** Normalize a crop or variety name for comparison (lowercase, alphanumeric only) */
export function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface ICropVarietyPair {
  crop: string;
  variety: string;
  source: string;
  original_crop: string;
  original_variety: string;
  location_id?: string;
}

export interface IDuplicateGroup {
  crop: string;
  normalized_variety: string;
  variants: string;
  variant_count: number;
  sources: string;
  locations: string;
}

/**
 * Group crop/variety pairs by normalized crop/variety key, returning only groups
 * with more than one distinct spelling (e.g. PHB-30-D79 vs PHB-30D79).
 */
export function groupDuplicateVarieties(pairs: ICropVarietyPair[]): IDuplicateGroup[] {
  const variantSpellings = new Map<string, Set<string>>();
  const crops = new Map<string, Set<string>>();
  const sources = new Map<string, Set<string>>();
  const locations = new Map<string, Set<string>>();

  for (const pair of pairs) {
    const key = `${pair.crop}/${pair.variety}`;
    if (!variantSpellings.has(key)) {
      variantSpellings.set(key, new Set());
      crops.set(key, new Set());
      sources.set(key, new Set());
      locations.set(key, new Set());
    }
    variantSpellings.get(key)?.add(pair.original_variety);
    crops.get(key)?.add(pair.original_crop);
    sources.get(key)?.add(pair.source);
    if (pair.location_id) locations.get(key)?.add(pair.location_id);
  }

  const groups: IDuplicateGroup[] = [];
  for (const [key, spellings] of variantSpellings.entries()) {
    // Only flag groups with more than one distinct spelling
    if (spellings.size <= 1) continue;
    const [normCrop, normVariety] = key.split('/');
    const cropList = [...(crops.get(key) ?? [])].sort((a, b) => a.localeCompare(b));
    const variantList = [...spellings].sort((a, b) => a.localeCompare(b));
    const sourceList = [...(sources.get(key) ?? [])].sort((a, b) => a.localeCompare(b));
    const locationList = [...(locations.get(key) ?? [])].sort((a, b) => a.localeCompare(b));
    groups.push({
      crop: cropList.join(', '),
      normalized_variety: `${normCrop}/${normVariety}`,
      variants: variantList.join(', '),
      variant_count: variantList.length,
      sources: sourceList.join(', '),
      locations: locationList.join(', '),
    });
  }

  return groups.sort(
    (a, b) => a.crop.localeCompare(b.crop) || a.normalized_variety.localeCompare(b.normalized_variety),
  );
}
