/**
 * Consultant crop-name -> canonical `ICropName` mapping.
 *
 * The xlsx uses ~50 spellings including Chichewa names (Chimanga, Mtedza,
 * Nyemba, Mbatata, Chinangwa, Khobwe), case variants and Excel line-wrap
 * fragments (`Sweet`/`Potatoes`, `Pigeon`/`peas`). Unmapped names (notably
 * `Banana`, which has no `ICropName`) are reported and skipped — crops are
 * never invented.
 */
import type { ICropName } from '@picsa/data';

const CROP_NAME_MAPPING: Record<string, ICropName> = {
  maize: 'maize',
  chimanga: 'maize',
  sorghum: 'sorghum',
  beans: 'beans',
  nyemba: 'beans',
  groundnuts: 'groundnuts',
  mtedza: 'groundnuts',
  'soya-beans': 'soya-beans',
  soya: 'soya-beans',
  soybean: 'soya-beans',
  sunflower: 'sunflower',
  cowpeas: 'cowpeas',
  'cow-peas': 'cowpeas',
  'cowpeas ': 'cowpeas',
  khobwe: 'cowpeas',
  cotton: 'cotton',
  sesame: 'sesame',
  rice: 'rice',
  millet: 'millet',
  'pearl-millet': 'pearl-millet',
  'sweet-potatoes': 'sweet-potatoes',
  'sweet-potato': 'sweet-potatoes',
  sweet: 'sweet-potatoes',
  potatoes: 'sweet-potatoes',
  potato: 'potato',
  'pigeon-peas': 'pigeon-peas',
  pigeon: 'pigeon-peas',
  peas: 'pigeon-peas',
  pigeonpeas: 'pigeon-peas',
  cassava: 'cassava',
  chinangwa: 'cassava',
  'ground-beans': 'bambaranuts',
  groundbeans: 'bambaranuts',
  'bambara-nuts': 'bambaranuts',
  bambaranuts: 'bambaranuts',
  bean: 'beans',
  mbatata: 'sweet-potatoes',
};

function normalizeCropName(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/_/g, '-');
}

/** Canonicalise a consultant crop cell (after forward-fill) to `ICropName`. */
export function canonicaliseCropName(raw: string | null | undefined): ICropName | null {
  const key = normalizeCropName(raw);
  if (!key) return null;
  const direct = CROP_NAME_MAPPING[key];
  if (direct) return direct;
  // Minor spelling tolerance: collapse doubled separators already handled;
  // try space/hyphen-insensitive lookup.
  const squashed = key.replace(/[-\s]+/g, '');
  for (const [alias, canonical] of Object.entries(CROP_NAME_MAPPING)) {
    if (alias.replace(/[-\s]+/g, '') === squashed) return canonical;
  }
  return null;
}

export default CROP_NAME_MAPPING;
