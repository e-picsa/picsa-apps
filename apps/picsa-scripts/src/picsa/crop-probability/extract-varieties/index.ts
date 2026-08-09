import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { parseDaysRange, parseVarietyString, roundToNearest, IParsedVarietyOccurrence } from './parser';
import { sanitizeCropVarietyMapping } from './cleaning-rules';
import { ensureDir } from 'fs-extra';

const DATA_DIR = resolve(__dirname, '../../../../../picsa-tools/crop-probability-tool/src/app/data');
const TARGET_COUNTRIES = ['mw', 'zw']; // Target MW and ZW, ignore ZM

interface ICropVarietyRowCSV {
  country_code: string;
  crop: string;
  variety: string;
  maturity_period: string;
  days_lower: number;
  days_upper: number;
  additional_info: string;
  additional_data: string; // JSON string
}

interface ICropDownscaledRowCSV {
  country_code: string;
  location_id: string;
  water_requirements: string; // JSON string
  override_data: string; // JSON string ({})
  station_id: string;
}

interface ISublocationWaterScan {
  country: string;
  district: string;
  sublocations: string[];
  differing_crop_sets: Record<string, string[]>;
  water_discrepancies: {
    crop: string;
    variety: string;
    min_water: number;
    max_water: number;
    pct_diff: number;
    sublocation_values: Record<string, number>;
  }[];
}

function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Maps raw station filename to canonical district / location ID
 */
function getDistrictId(fileName: string): string {
  const baseName = fileName.replace('.json', '');
  if (baseName.startsWith('chapananga--')) return 'chikwawa';
  const parts = baseName.split('--');
  return parts[0] || baseName;
}

async function runVarietyExtraction() {
  console.log(`\n======================================================`);
  console.log(`  CROP VARIETY EXTRACTION & DB CSV EXPORTER`);
  console.log(`======================================================`);
  console.log(`Target Countries: ${TARGET_COUNTRIES.map((c) => c.toUpperCase()).join(', ')}\n`);

  const allOccurrences: IParsedVarietyOccurrence[] = [];
  const stationsCount: Record<string, number> = {};

  // Store raw station data per district: country -> district_id -> sublocation_id -> crop -> variety -> water_mm
  const districtSublocationWaterReqs: Record<
    string,
    Record<string, Record<string, Record<string, Record<string, number>>>>
  > = {};

  for (const country of TARGET_COUNTRIES) {
    const countryDir = resolve(DATA_DIR, country);
    let files: string[] = [];
    try {
      files = await readdir(countryDir);
    } catch (err) {
      console.error(`Could not read directory for ${country}: ${countryDir}`);
      continue;
    }

    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    stationsCount[country] = jsonFiles.length;
    districtSublocationWaterReqs[country] ??= {};

    for (const file of jsonFiles) {
      const filePath = resolve(countryDir, file);
      const content = await readFile(filePath, 'utf8');
      if (!content.trim() || content.trim() === '[]') continue;

      try {
        const stationData = JSON.parse(content);
        const rawStationId = file.replace('.json', '');
        const districtId = getDistrictId(file);

        districtSublocationWaterReqs[country][districtId] ??= {};
        districtSublocationWaterReqs[country][districtId][rawStationId] ??= {};

        if (Array.isArray(stationData)) {
          for (const cropSection of stationData) {
            const rawCrop = cropSection.crop || 'unknown';
            if (Array.isArray(cropSection.data)) {
              for (const item of cropSection.data) {
                const rawVariety = item.variety || '';
                const daysRange = parseDaysRange(item.days);
                const extractedVarieties = parseVarietyString(rawVariety);

                // Water requirement (first element in array if available)
                const rawWater = Array.isArray(item.water) && item.water.length > 0 ? Number(item.water[0]) : 0;
                const roundedWater = roundToNearest(rawWater, 5);

                for (const parsedVar of extractedVarieties) {
                  const sanitized = sanitizeCropVarietyMapping(rawCrop, parsedVar.variety);
                  if (!sanitized.valid) continue;

                  const finalCrop = sanitized.normalizedCrop;
                  const finalVariety = sanitized.normalizedVariety;

                  allOccurrences.push({
                    country,
                    station_id: rawStationId,
                    station_name: rawStationId.replace(/--|_/g, ' '),
                    crop: finalCrop,
                    variety: finalVariety,
                    local_name: parsedVar.local_name,
                    raw_variety_entry: rawVariety,
                    days: daysRange,
                    water: roundedWater,
                  });

                  // Record water requirement under country -> district -> sublocation -> crop -> variety
                  districtSublocationWaterReqs[country][districtId][rawStationId][finalCrop] ??= {};
                  if (roundedWater > 0) {
                    districtSublocationWaterReqs[country][districtId][rawStationId][finalCrop][finalVariety] =
                      roundedWater;
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing ${file}:`, err);
      }
    }
  }

  // Perform Sublocation Discrepancy Scan per District
  const sublocationScanResults: ISublocationWaterScan[] = [];

  for (const country of TARGET_COUNTRIES) {
    for (const [districtId, sublocationsMap] of Object.entries(districtSublocationWaterReqs[country] || {})) {
      const sublocationIds = Object.keys(sublocationsMap);
      if (sublocationIds.length <= 1) continue; // Skip single sublocation districts

      const cropSets: Record<string, string[]> = {};
      for (const [subId, crops] of Object.entries(sublocationsMap)) {
        cropSets[subId] = Object.keys(crops);
      }

      // Collect water values across sublocations for every crop variety
      const varietyWaterMap: Record<string, Record<string, number>> = {}; // "crop::variety" -> { subId: water }

      for (const [subId, crops] of Object.entries(sublocationsMap)) {
        for (const [crop, varieties] of Object.entries(crops)) {
          for (const [variety, water] of Object.entries(varieties)) {
            const key = `${crop}::${variety}`;
            varietyWaterMap[key] ??= {};
            varietyWaterMap[key][subId] = water;
          }
        }
      }

      const waterDiscrepancies: ISublocationWaterScan['water_discrepancies'] = [];

      for (const [key, subMap] of Object.entries(varietyWaterMap)) {
        const [crop, variety] = key.split('::');
        const values = Object.values(subMap);
        if (values.length > 1) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const pctDiff = min > 0 ? Math.round(((max - min) / min) * 100) : 0;

          if (pctDiff > 10) {
            waterDiscrepancies.push({
              crop,
              variety,
              min_water: min,
              max_water: max,
              pct_diff: pctDiff,
              sublocation_values: subMap,
            });
          }
        }
      }

      sublocationScanResults.push({
        country,
        district: districtId,
        sublocations: sublocationIds,
        differing_crop_sets: cropSets,
        water_discrepancies: waterDiscrepancies,
      });
    }
  }

  // Group occurrences by (country, crop, variety) for Primary CSV
  const varietyGroups: Record<
    string,
    {
      country: string;
      crop: string;
      variety: string;
      local_names: Set<string>;
      occurrences: IParsedVarietyOccurrence[];
    }
  > = {};

  for (const occ of allOccurrences) {
    const key = `${occ.country}::${occ.crop}::${occ.variety}`;
    if (!varietyGroups[key]) {
      varietyGroups[key] = {
        country: occ.country,
        crop: occ.crop,
        variety: occ.variety,
        local_names: new Set<string>(),
        occurrences: [],
      };
    }
    varietyGroups[key].occurrences.push(occ);
    if (occ.local_name) {
      varietyGroups[key].local_names.add(occ.local_name);
    }
  }

  // Build Output Files
  const outputDir = resolve(__dirname, 'output');
  await ensureDir(outputDir);

  // Save Sublocation Scan Audit JSON
  const sublocationAuditPath = resolve(outputDir, 'sublocation_discrepancies.json');
  await writeFile(sublocationAuditPath, JSON.stringify(sublocationScanResults, null, 2));

  for (const country of TARGET_COUNTRIES) {
    const countryVarGroups = Object.values(varietyGroups).filter((g) => g.country === country);

    const primaryCSVRows: ICropVarietyRowCSV[] = [];

    for (const group of countryVarGroups) {
      const rangeFreq: Record<string, { days_lower: number; days_upper: number; count: number; stations: string[] }> =
        {};

      for (const occ of group.occurrences) {
        const rangeKey = `${occ.days.days_lower}-${occ.days.days_upper}`;
        if (!rangeFreq[rangeKey]) {
          rangeFreq[rangeKey] = {
            days_lower: occ.days.days_lower,
            days_upper: occ.days.days_upper,
            count: 0,
            stations: [],
          };
        }
        rangeFreq[rangeKey].count++;
        if (!rangeFreq[rangeKey].stations.includes(occ.station_id)) {
          rangeFreq[rangeKey].stations.push(occ.station_id);
        }
      }

      const sortedRanges = Object.values(rangeFreq).sort((a, b) => b.count - a.count);
      const modalRange = sortedRanges[0];

      const additionalDataObject: Record<string, any> = {};
      if (group.local_names.size > 0) {
        additionalDataObject.local_name = Array.from(group.local_names).join(', ');
      }

      if (sortedRanges.length > 1) {
        const rangeDetails = sortedRanges
          .map(
            (r) =>
              `${r.days_lower}-${r.days_upper} (${r.count} station${r.count > 1 ? 's' : ''}${r.count < 5 ? `: ${r.stations.join(', ')}` : ''})`,
          )
          .join('; ');
        additionalDataObject.days_comment = `Noted ranges across stations: ${rangeDetails}`;
      }

      primaryCSVRows.push({
        country_code: country,
        crop: group.crop,
        variety: group.variety,
        maturity_period: '',
        days_lower: modalRange.days_lower,
        days_upper: modalRange.days_upper,
        additional_info: '',
        additional_data: JSON.stringify(additionalDataObject),
      });
    }

    // Write Primary crop_data_rows.[country].csv
    const primaryCSVPath = resolve(outputDir, `crop_data_rows.${country}.csv`);
    const primaryHeader =
      'country_code,crop,variety,maturity_period,days_lower,days_upper,additional_info,additional_data\n';
    const primaryBody = primaryCSVRows
      .map((r) =>
        [
          escapeCSVField(r.country_code),
          escapeCSVField(r.crop),
          escapeCSVField(r.variety),
          escapeCSVField(r.maturity_period),
          escapeCSVField(r.days_lower),
          escapeCSVField(r.days_upper),
          escapeCSVField(r.additional_info),
          escapeCSVField(r.additional_data),
        ].join(','),
      )
      .join('\n');

    await writeFile(primaryCSVPath, primaryHeader + primaryBody, 'utf8');

    // Write Secondary crop_data_downscaled_rows.[country].csv (1 row per district)
    const downscaledCSVRows: ICropDownscaledRowCSV[] = [];
    const countryDistricts = districtSublocationWaterReqs[country] || {};

    for (const [districtId, sublocationsMap] of Object.entries(countryDistricts)) {
      // Aggregate crop variety water requirements across all sublocations in this district
      const districtCrops: Record<string, Record<string, number>> = {};

      // Frequency & value collection per (crop, variety)
      const varValues: Record<string, Record<string, number[]>> = {};

      for (const crops of Object.values(sublocationsMap)) {
        for (const [crop, varieties] of Object.entries(crops)) {
          for (const [variety, water] of Object.entries(varieties)) {
            varValues[crop] ??= {};
            varValues[crop][variety] ??= [];
            varValues[crop][variety].push(water);
          }
        }
      }

      // Pick modal / average water requirement per (crop, variety) for the district
      for (const [crop, varieties] of Object.entries(varValues)) {
        districtCrops[crop] = {};
        for (const [variety, values] of Object.entries(varieties)) {
          // Compute average of non-zero values, rounded to nearest 5
          const nonZero = values.filter((v) => v > 0);
          if (nonZero.length > 0) {
            const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
            districtCrops[crop][variety] = roundToNearest(avg, 5);
          }
        }
      }

      const districtStationId = `${country}/${districtId}`;

      downscaledCSVRows.push({
        country_code: country,
        location_id: districtId,
        water_requirements: JSON.stringify(districtCrops),
        override_data: '{}',
        station_id: districtStationId,
      });
    }

    const downscaledCSVPath = resolve(outputDir, `crop_data_downscaled_rows.${country}.csv`);
    const downscaledHeader = 'country_code,location_id,water_requirements,override_data,station_id\n';
    const downscaledBody = downscaledCSVRows
      .map((r) =>
        [
          escapeCSVField(r.country_code),
          escapeCSVField(r.location_id),
          escapeCSVField(r.water_requirements),
          escapeCSVField(r.override_data),
          escapeCSVField(r.station_id),
        ].join(','),
      )
      .join('\n');

    await writeFile(downscaledCSVPath, downscaledHeader + downscaledBody, 'utf8');

    // Print Country End Summary
    console.log(`Country [${country.toUpperCase()}] Export Summary:`);
    console.log(` - Total Station files: ${stationsCount[country] || 0}`);
    console.log(` - Districts output:    ${downscaledCSVRows.length} (1 row per district)`);
    console.log(` - Unique varieties:    ${primaryCSVRows.length}`);
    console.log(` - Primary DB CSV:      ${primaryCSVPath}`);
    console.log(` - Downscaled DB CSV:   ${downscaledCSVPath}\n`);
  }

  // Print Sublocation Discrepancy Scan Report to Console
  console.log(`------------------------------------------------------`);
  console.log(` SUBLOCATION DISCREPANCY SCAN REPORT (District Merges)`);
  console.log(`------------------------------------------------------`);

  for (const scan of sublocationScanResults) {
    console.log(
      `District: [${scan.country.toUpperCase()}/${scan.district}] (${scan.sublocations.length} sublocation stations: ${scan.sublocations.join(', ')})`,
    );
    if (scan.water_discrepancies.length > 0) {
      console.log(`  Water requirement variations (>10% diff):`);
      for (const disc of scan.water_discrepancies) {
        console.log(
          `   * Crop: ${disc.crop} | Variety: "${disc.variety}" -> range: ${disc.min_water}mm - ${disc.max_water}mm (${disc.pct_diff}% diff)`,
        );
      }
    } else {
      console.log(`  ✓ Water requirement values are virtually identical across sublocations (<10% diff).`);
    }
    console.log('');
  }

  console.log(`Sublocation scan report saved to: ${sublocationAuditPath}`);
  console.log(`======================================================\n`);
}

runVarietyExtraction();
