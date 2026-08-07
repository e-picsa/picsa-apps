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

function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function runVarietyExtraction() {
  console.log(`\n======================================================`);
  console.log(`  CROP VARIETY EXTRACTION & DB CSV EXPORTER`);
  console.log(`======================================================`);
  console.log(`Target Countries: ${TARGET_COUNTRIES.map((c) => c.toUpperCase()).join(', ')}\n`);

  const allOccurrences: IParsedVarietyOccurrence[] = [];
  const stationsCount: Record<string, number> = {};

  // Track downscaled water requirements per station: station_key -> crop -> variety -> water_mm
  const stationWaterReqs: Record<
    string,
    { country: string; location_id: string; crops: Record<string, Record<string, number>> }
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

    for (const file of jsonFiles) {
      const filePath = resolve(countryDir, file);
      const content = await readFile(filePath, 'utf8');
      if (!content.trim() || content.trim() === '[]') continue;

      try {
        const stationData = JSON.parse(content);
        const rawStationId = file.replace('.json', '');
        const fullStationId = `${country}/${rawStationId}`;
        const locationId = rawStationId.split('--')[0] || rawStationId;

        stationWaterReqs[fullStationId] ??= { country, location_id: locationId, crops: {} };

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

                  // Record station downscaled water requirement
                  stationWaterReqs[fullStationId].crops[finalCrop] ??= {};
                  if (roundedWater > 0) {
                    stationWaterReqs[fullStationId].crops[finalCrop][finalVariety] = roundedWater;
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

  // Group occurrences by (country, crop, variety)
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

  // Build CSV Rows & Perform Modal Selection for Inconsistent Days
  const outputDir = resolve(__dirname, 'output');
  await ensureDir(outputDir);

  for (const country of TARGET_COUNTRIES) {
    const countryVarGroups = Object.values(varietyGroups).filter((g) => g.country === country);

    const primaryCSVRows: ICropVarietyRowCSV[] = [];

    for (const group of countryVarGroups) {
      // Frequency map of days ranges: "days_lower-days_upper" -> count & stations list
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

      // Sort ranges by frequency descending (most common / modal range first)
      const sortedRanges = Object.values(rangeFreq).sort((a, b) => b.count - a.count);
      const modalRange = sortedRanges[0];

      // Build additional_data JSON object using sensible prefixes (local_name and days_comment)
      const additionalDataObject: Record<string, any> = {};

      // Include local_name if extracted
      if (group.local_names.size > 0) {
        additionalDataObject.local_name = Array.from(group.local_names).join(', ');
      }

      // If multiple ranges observed across stations, detail secondary ranges in days_comment
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
        maturity_period: '', // Empty or inferred
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

    // Write Secondary crop_data_downscaled_rows.[country].csv
    const downscaledCSVRows: ICropDownscaledRowCSV[] = [];
    const countryStations = Object.entries(stationWaterReqs).filter(([stId, stData]) => stData.country === country);

    for (const [stationId, stData] of countryStations) {
      downscaledCSVRows.push({
        country_code: country,
        location_id: stData.location_id,
        water_requirements: JSON.stringify(stData.crops),
        override_data: '{}',
        station_id: stationId,
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
    const totalVarieties = primaryCSVRows.length;
    const varietiesWithNotes = primaryCSVRows.filter((r) => r.additional_data.includes('days_comment')).length;

    console.log(`Country [${country.toUpperCase()}] Export Summary:`);
    console.log(` - Stations processed:  ${stationsCount[country] || 0}`);
    console.log(` - Unique varieties:    ${totalVarieties}`);
    console.log(` - Multi-range notes:   ${varietiesWithNotes}`);
    console.log(` - Primary DB CSV:      ${primaryCSVPath}`);
    console.log(` - Downscaled DB CSV:   ${downscaledCSVPath}\n`);
  }

  console.log(`======================================================\n`);
}

runVarietyExtraction();
