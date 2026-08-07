/**
 * Explicit data cleaning operations and manual overrides for crop variety extraction.
 * Co-located with extract-varieties script.
 */

/** Known variety-to-crop lookup table for correcting misclassified raw data entries */
const KNOWN_VARIETY_CROP_MAP: Record<string, string[]> = {
  beans: [
    'NUA',
    'NUA-BEANS',
    'CHIMBAMBA',
    'NAPILIRA',
    'NAMAJENGO',
    'SAPEREKEDWA',
    'KALINTSIRO',
    'KALIMA',
    'BUNDA-93',
    'KHOLOPHETE',
    'KANZAMA',
    'NASAKA',
    'BWENZILA-ANA',
  ],
  groundnuts: [
    'CG-7',
    'CG-8',
    'CG-9',
    'CG-10',
    'CG-11',
    'CG-12',
    'CG-13',
    'CG-14',
    'CHALIMBANA',
    'CHITALA',
    'BAKA',
    'G-7',
    'MSINJIRO',
    'MALIMBA',
    'MAKULU-RED',
    'NATAL-COMMON',
    'SOLONTONI',
    'WAMUSANGA',
    'CHAMPION',
    'CHIPEGO',
    'CHISHANGO',
    'KACHOLOLO',
    'LUPANDE',
    'NACHIKONDO',
    'MGV4',
    'MGV5',
    'MGV8',
  ],
  'pigeon-peas': [
    'ICEAP-00040',
    'ICEAP00040',
    'ICEAP-00557',
    'ICEAP00557',
    'MWAIWATHUALIMI',
    'MWAYIWATHU-ALIMI',
    'MWAIWATHU-ALIMI',
    'MTHAWAJUNI',
    'NTHAWA-JUNE',
    'SAUMA',
    'KACHANGU',
    'ICPL-87015',
    'ICPL-93026',
    'ICPL87015',
    'ICPL93026',
  ],
  cotton: [
    'MAHYCO-C-577',
    'MAHYCO-C-569',
    'MAHYCO-570',
    'MAHYCO-571',
    'MAHYCO-C577',
    'MAHYCO-C569',
    'CDT-II',
    'CHURAZA',
    'F135',
    'ALBAR',
    'G51',
  ],
  cowpeas: [
    'SUDAN-1',
    'IT-82E-16',
    'IT82E-16',
    'CBC-1',
    'CBC-2',
    'IT-18',
    'BLACK-EYED',
    'BROWN-EYED',
    'BUBEBE',
    'CHIPINI',
    'LUTEMBWE',
    'MUSANDILE',
    'NAMUSEBA',
    'RED-EYE',
  ],
};

/**
 * Pre-processes raw variety string before main tokenization:
 * - Fixes missing commas after parentheses (e.g. "SC304 (Kalulu) SC301(Kalulu)" -> "SC304 (Kalulu), SC301(Kalulu)")
 * - Fixes concatenated 'or'/'and' boundaries (e.g. "DK-8033 ORSC403" -> "DK-8033, SC403", "ICPL-87015 AND ICPL93026" -> "ICPL-87015, ICPL93026")
 * - Fixes space-separated variety codes (e.g. "SC-729 DK 777" -> "SC-729, DK 777", "CG-7 CG8" -> "CG-7, CG8", "SC-304 SC301" -> "SC-304, SC301")
 * - Removes non-variety artifacts like ellipsis symbols ("…", "...", "‚Ä¶")
 */
export function cleanRawVarietyEntryString(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // Remove UTF-8 artifacts, ellipsis, and non-printable noise
  text = text.replace(/…|\.\.\.|‚Ä¶/g, ' ');

  const BRAND_PREFIX_PATTERN =
    /(?:SC|DK|DKC|PAN|PAN4M|MH|CG|ZM|MRI|PHB|P3812W|P3506W|PIONEER|KKS|LAKE|AMAC|SY|WH|ZMS|PMV|FMV|CBC|CDT|PGS|ICPL|SV|IT)/i;

  // Fix missing commas after parenthetical local names before a new variety code: e.g. "SC304 (Kalulu) SC301(Kalulu)" -> "SC304 (Kalulu), SC301(Kalulu)"
  text = text.replace(new RegExp(`\\)\\s*(${BRAND_PREFIX_PATTERN.source}[-\\s]?\\d+)`, 'gi'), '), $1');

  // Fix concatenated 'or' or 'AND' missing spaces/delimiters (e.g. "ORSC403" -> ", SC403", "AND ICPL" -> ", ICPL")
  text = text.replace(/(\b[A-Z0-9-]+)\s*(?:OR|or)([A-Z]{2,}\d+)/gi, '$1, $2');
  text = text.replace(/(\b[A-Z0-9-]+)\s+(?:AND|and)\s+([A-Z0-9-]+)/gi, '$1, $2');

  // Fix space-separated adjacent variety codes where a new brand prefix appears without a comma
  // e.g. "SC-729 DK 777" -> "SC-729, DK 777" | "CG-7 CG8" -> "CG-7, CG8" | "SC-304 SC301" -> "SC-304, SC301"
  text = text.replace(new RegExp(`(\\b[A-Z0-9-]+)\\s+(${BRAND_PREFIX_PATTERN.source}[-\\s]?\\d+)`, 'gi'), '$1, $2');

  return text;
}

/**
 * Standardizes variety ID:
 * - UPPERCASE
 * - Inserts hyphen between brand prefix letters and numbers if missing (e.g. SC403 -> SC-403, DKC8033 -> DKC-8033)
 * - Replaces ALL spaces within variety ID with hyphens (e.g. "PEACOCK 10" -> "PEACOCK-10", "MAHYCO C 577" -> "MAHYCO-C-577")
 */
export function formatVarietyId(varietyName: string): string {
  if (!varietyName) return '';
  let id = varietyName.toUpperCase().trim();

  // Standardize NUA variants
  if (id === 'NUA BEANS' || id === 'NUA-BEANS') {
    id = 'NUA';
  }

  // Insert hyphen between brand prefix letters and numbers if missing (e.g. SC403 -> SC-403, DKC8033 -> DKC-8033)
  id = id.replace(/^([A-Z]{1,6})(\d+[A-Z0-9]*)/, '$1-$2');

  // Replace all internal spaces with hyphens so NO entries have spaces in their variety ID name
  id = id.replace(/\s+/g, '-');

  // Clean up duplicate hyphens (e.g. "PAN--4M" -> "PAN-4M")
  id = id.replace(/-+/g, '-');

  return id;
}

/**
 * Validates crop-variety alignment & performs domain remapping:
 * - Remaps misclassified varieties (e.g. CG-7 under cowpeas -> groundnuts, ICEAP00557 under groundnuts -> pigeon-peas, Mahyco under cowpeas -> cotton)
 * - Filters out invalid artifact tokens (e.g. empty strings, standalone punctuation).
 */
export function sanitizeCropVarietyMapping(
  crop: string,
  varietyId: string,
): { valid: boolean; normalizedCrop: string; normalizedVariety: string } {
  const normVariety = formatVarietyId(varietyId);

  // Ignore invalid noise/artifact tokens
  if (!normVariety || normVariety === '-' || normVariety === '…' || normVariety.length < 2) {
    return { valid: false, normalizedCrop: crop, normalizedVariety: '' };
  }

  // Check variety remapping dictionary to fix raw misclassifications across stations
  for (const [targetCrop, varieties] of Object.entries(KNOWN_VARIETY_CROP_MAP)) {
    if (varieties.includes(normVariety)) {
      return { valid: true, normalizedCrop: targetCrop, normalizedVariety: normVariety };
    }
  }

  return { valid: true, normalizedCrop: crop, normalizedVariety: normVariety };
}
