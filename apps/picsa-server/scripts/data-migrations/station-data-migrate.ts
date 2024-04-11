/**
 * NOTE
 * Due to inconsistencies in source data migrations not possible
 * - lack of station id for mw data
 * - duplicate entries for many crop variety (e.g. pan4m-19)
 * - multiple probability entries from unclear params (e.g. 2-8/10)
 * - zm nested requirements, e.g. green/dry
 */

const STATION_ID_MAPPING = {
  chipata: 1,
  petauke: 33,
  // TODO - migrate to correct (zm placeholders used)
  kasungu: 16,
  nkhotakota: 23,
};
/**
 * Take list of all crop entries by station and generate initial seed entries
 * for main crop-data table. This simply contains crop and variety names, along with labels
 */
function migrateCropData(data: any[]) {
  const stationEntries = extractNestedVarieties(data);
  const uniqueEntryHashmap = mergeStationEntries(stationEntries);
  return Object.values(uniqueEntryHashmap);
}

/**
 * Take list of all crop entries by station and generate a list of only
 * station-specific differences against base table data
 */
function migrateCropStationData(data: any[]) {
  const stationEntries = extractNestedVarieties(data);
  return stationEntries.map((entry) => {
    const cleaned = cleanCropStationData(entry);
    const { crop, variety, label, ...rest } = cleaned;
    const crop_id = `${crop}/${variety}`;
    return { crop_id, ...rest };
  });
}

/**
 * Take a list of all entries across stations and merge where crop/variety identical
 * For now this only combines labels if different ones provided
 */
function mergeStationEntries(stationEntries: any[]) {
  const mergedEntries: Record<string, any> = {};
  console.log('merged entries');
  for (const el of stationEntries) {
    const { crop, variety } = el;
    const id = `${crop}/${variety}`;
    mergedEntries[id] = mergeCropEntries(el, mergedEntries[id]);
  }
  return mergedEntries;
}

function cleanCropStationData(entry: any) {
  let { station_id, crop, days, water, variety, label, ...probabilityEntries } = entry;

  //   ensure water and days parsed as string to handle consistently
  const waterStr = `${water || 0}`;
  const daysStr = `${days || 0}`;
  //   extract water bounds from string
  let [water_lowerStr, water_upperStr] = waterStr?.split('-') || ['0', '0'];
  if (!water_upperStr) {
    water_upperStr = water_lowerStr;
  }
  const water_lower = Number(water_lowerStr.replace(/[^0-9]/g, ''));
  const water_upper = Number(water_upperStr.replace(/[^0-9]/g, ''));

  //   extract day bounds from string
  let [days_lowerStr, days_upperStr] = daysStr?.split('-') || ['0', '0'];
  if (!days_upperStr) {
    days_upperStr = days_lowerStr;
  }
  const days_lower = Number(days_lowerStr.replace(/[^0-9]/g, ''));
  const days_upper = Number(days_upperStr.replace(/[^0-9]/g, ''));

  // convert string /10 probabilities to numerical
  // record separate values for cases where both lower and upper calc bounds given, e.g 7-8/10
  const probability_lower: number[] = [];
  const probability_upper: number[] = [];
  for (const probStr of Object.values<string>(probabilityEntries) || []) {
    let [lower, upper] = probStr.replace('/10', '').split('-');
    if (!upper) upper = lower;
    probability_lower.push(Number(lower) / 10);
    probability_upper.push(Number(upper) / 10);
  }

  return {
    station_id,
    crop,
    variety,
    label,
    water_lower,
    water_upper,
    days_lower,
    days_upper,
    probabilities: [probability_lower, probability_upper],
  };
}

/**
 * Extract crop data from station data. Reformats water and day upper/lower bounds,
 * and generates individual entries where varieties previously merged (same water and day requirements)
 */
function extractNestedVarieties(data: any[]) {
  const entries: any[] = [];
  for (const { id, station_data } of data) {
    // merge parent station_id
    const station_id = STATION_ID_MAPPING[id];
    for (const { variety, ...rest } of station_data) {
      // split multiple variety strings to unique, single entries
      const varietyNames: string[] = [
        ...new Set<string>(
          variety
            .replace(/ or/gi, ' or ') // hack, fix missing spaces "varietyA orVarietyB"
            .replace(/ or /gi, ',') // hack, replace or statements for comma
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v !== '' && v !== '-') // hack, remove (mostly) empty entries
        ),
      ];
      console.log('names', varietyNames);
      const labelRegex = /\([a-z]*\)/gi;
      for (const varietyName of varietyNames) {
        const entry = {
          station_id,
          ...rest,
        } as any;
        entry.variety = varietyName;
        const match = labelRegex.exec(varietyName);
        if (match) {
          const [label] = match;
          entry.variety = varietyName.replace(label, '').trim();
          entry.label = label.replace(/[()]/gi, '');
        }

        entry.variety = entry.variety
          .trim()
          .replace(/[^0-9a-z-]/gi, '-')
          .toUpperCase();
        entries.push(entry);
      }
    }
  }
  return entries;
}

/**
 * Combine data for same crop that may be provided by different stations
 * For now this only ensures labels preserved
 */
function mergeCropEntries(a: any, b: any = {}) {
  // fields should be identical in both
  const { crop, variety } = a;
  return {
    crop,
    variety,
    // combine all labels
    label: [...new Set([a.label, b.label])].filter((v) => v).join(',') || '',
  };
}
