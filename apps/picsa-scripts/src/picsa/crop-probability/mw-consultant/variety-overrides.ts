/**
 * MW-consultant row-level crop correction (one-shot, MW-scoped).
 *
 * The consultant's crop column is mislabelled in whole rows (Rice under
 * `Maize`, Soya under `Bean(s)`/`Groundnuts`/`Cowpeas`/`Pigeon peas`, Potato
 * under `Rice`/`Potatoes`, Groundnut varieties under `Beans`, Banana under
 * `Cassava`). The shared extractor only remaps varieties it knows, so entire
 * crop groups leak into the wrong `crop_data` rows and the prod SQL.
 *
 * Strategy: UNAMBIGUOUS variety markers only. A row switches crop iff some
 * other crop scores and the row's own crop scores zero (all its tokens are
 * unknown to its own crop). Ambiguous names shared across crops (see
 * AMBIGUOUS_TOKENS: TIKOLORE, KAKOMA, MPATSA, KENYA, ...) can never trigger
 * a switch alone; neither can mixed rows (logged, kept as written). A row
 * carrying an unambiguous marker (e.g. SC-SIGNAL) alongside ambiguous names
 * still switches, since the ambiguous names count for neither side.
 *
 * Deliberately NOT touched: the shared `cleaning-rules.ts` (blast radius
 * across ZM/ZW) and per-token sanitizer behaviour (still applies after).
 */
import type { ICropName } from '@picsa/data';

export function splitCamelOrVarieties(raw: string): string {
  return raw.replace(/([a-z])or([A-Z])/g, '$1, $2');
}

/** MW pre-clean: descriptive prefixes, '&' lists, camelCase 'or' splits. */
export function preCleanMwVarietyCell(raw: string | null): string {
  if (!raw) return '';
  let text = raw.replace(/^(hybrid varieties|opv varieties|local varieties)\s*[:;]?\s*/i, '').trim();
  text = text.replace(/\s*&\s*/g, ', ');
  text = splitCamelOrVarieties(text);
  return text.trim();
}

/** Tokens that are the crop name itself, not a variety (dropped). */
const CROP_WORD_TOKENS = new Set([
  'GROUND-BEANS',
  'GROUNDNUTS',
  'GROUNDNUT',
  'MAIZE',
  'CORN',
  'RICE',
  'BEANS',
  'BEAN',
  'SOYA',
  'SOYABEANS',
  'POTATO',
  'POTATOES',
  'CASSAVA',
  'SORGHUM',
  'MILLET',
  'COTTON',
  'SESAME',
  'SUNFLOWER',
  'COWPEAS',
  'COW-PEA',
  'PEAS',
  'PIGEON-PEAS',
  'PIGEON',
  'TOBACCO',
]);

/** Trailing crop word glued onto a variety code (e.g. MH-34 MAIZE -> MH-34). */
const TRAILING_CROP_WORD =
  /-(MAIZE|BEANS|RICE|GROUNDNUTS|POTATO|CASSAVA|SORGHUM|MILLET|COTTON|SESAME|SUNFLOWER|COWPEAS|PEAS|PIGEON|SOYA)$/;

/** Canonicalise a parsed token; null means drop it. LOCAL variants unify. */
export function normaliseMwVarietyToken(variety: string): string | null {
  let v = variety
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '-');
  if (!v) return null;
  if (v === 'LOCAL-VARIETIES' || v === 'LOCAL-VARIETY' || v === 'LOCAL') return 'LOCAL';
  if (CROP_WORD_TOKENS.has(v)) return null;
  // Strip a glued crop word only off code-like prefixes (MH-34-MAIZE -> MH-34);
  // genuine two-word names (PEARL-MILLET) have no digits and are kept whole.
  const m = v.match(TRAILING_CROP_WORD);
  if (m && /\d/.test(v.slice(0, -m[0].length))) v = v.slice(0, -m[0].length);
  return v || null;
}

// ---------------------------------------------------------------------------
// Unambiguous per-crop variety markers (agronomically single-crop).
// ---------------------------------------------------------------------------
const RICE_MARKERS = new Set([
  'KAYANJAMALO',
  'KATETE',
  'MPETA',
  'NAZOLO',
  'NERICA',
  'NERICA-3',
  'NERICA-4',
  'NUNKILE',
  'SENGA',
  'WAMBONE',
  'KAMEME',
  'BLUE-BONNET',
  'CHANGU',
  'KILOMBERO',
  'VYAWO',
]);
const SOYA_MARKERS = new Set([
  'SC-SIGNAL',
  'SC-SEQUEL',
  'SC-SERENADE',
  'SC-SQUIRE',
  'SC-SAGA',
  'SOPRANO',
  'SOLITAIRE',
  'PAN-1867',
  'DUOCROP',
  'GEDULD',
  'OCEPARA-4',
  'SANTA-ROSA',
]);
const GROUNDNUT_MARKERS = new Set([
  'CG-7',
  'CG-8',
  'CG-9',
  'CG-10',
  'CG-11',
  'CG-12',
  'CG-13',
  'CG-14',
  'CG-15',
  'CG-16',
  'CG-17',
  'ICGV-SM-08528',
  'ICGV-SM-03530',
  'ICGV-SM-03517',
  'ICGV-SM-01514',
  'CHITALA',
  'BAKA',
  'MALIMBA',
  'MSINJIRO',
  'NATAL-COMMON',
  'MAKULU-RED',
  'SOLONTONI',
  'WAMUSANGA',
  'KACHOLOLO',
  'LUPANDE',
  'NACHIKONDO',
  'CHIPEGO',
  'CHISHANGO',
  'MGV-4',
  'MGV-5',
  'MGV-8',
  'CHAMPION',
  'CHALIMBANA',
  'G-7',
]);
const POTATO_MARKERS = new Set([
  'ROSITA',
  'CARDINAL-DESIREE',
  'THANDIZO',
  'MTUKULAPAKHOMO',
  'KASO',
  'UFULU',
  'VIOLET',
  'MWAI',
  'ZIKOMO',
  'NJULI',
  'CHUMA',
]);
/** Maize breeder codes; never matches a token that is an exact marker above. */
const MAIZE_BRAND =
  /^(SC|DK|DKC|MH|MRI|PAN|ZM|PHB|PGS|ETG|KC|KD|PEACOCK|GAYA|CML|PIONEER|KKS|LAKE|AMAC|P3812W|P3506W|ZMS|WH|SY|CBC|CDT|CGIAR|PANNAR)-?\d/i;
const CG_PATTERN = /^CG-\d+$/;
const ICGV_PATTERN = /^ICGV/;
/** Banana tokens: >=2 in one row means the row is mislabelled Banana (no Banana ICropName: skipped). */
const BANANA_TOKENS = new Set(['NDOKI', 'HARARE', 'GIANT', 'CAVENDISH', 'WILLIAMS', 'DWARF', 'KABUTHU']);

export interface IRowCropDecision {
  crop: ICropName;
  corrected: boolean;
  reason: string;
}

function countMarkers(tokens: Set<string>, markers: Set<string>): number {
  let n = 0;
  for (const t of tokens) if (markers.has(t)) n++;
  return n;
}

/** Variety names genuinely shared across crops: never native, never markers. */
const AMBIGUOUS_TOKENS = new Set([
  'TIKOLORE',
  'MAKWACHA',
  'NASOKO',
  'KAKOMA',
  'MPATSA',
  'KENYA',
  'MUGAMBA',
  'SEMUSA',
  'SALERA',
  'CHIPIKA',
  'NYAMOYO',
  'FAYA',
  'MTUPATUPA',
  'KAPHULIRA',
  'MTHETSANJALA',
]);

function isMarkerLike(t: string): boolean {
  return (
    RICE_MARKERS.has(t) ||
    SOYA_MARKERS.has(t) ||
    GROUNDNUT_MARKERS.has(t) ||
    POTATO_MARKERS.has(t) ||
    CG_PATTERN.test(t) ||
    ICGV_PATTERN.test(t) ||
    MAIZE_BRAND.test(t)
  );
}

function countGroundnut(tokens: Set<string>): number {
  let n = countMarkers(tokens, GROUNDNUT_MARKERS);
  for (const t of tokens) if (CG_PATTERN.test(t) || ICGV_PATTERN.test(t)) n++;
  return n;
}

function countMaizeBrands(tokens: Set<string>): number {
  const allMarkers = new Set<string>([...RICE_MARKERS, ...SOYA_MARKERS, ...GROUNDNUT_MARKERS, ...POTATO_MARKERS]);
  let n = 0;
  for (const t of tokens) {
    if (allMarkers.has(t) || CG_PATTERN.test(t) || ICGV_PATTERN.test(t)) continue;
    if (MAIZE_BRAND.test(t)) n++;
  }
  return n;
}

/**
 * Row-level crop correction. Switches the whole row to another crop only when
 * that crop scores and the row's own crop scores zero (via sanitizer mapping
 * for crops the shared extractor knows, via the sets above otherwise).
 * Banana rows are reported as mislabels (skipped downstream: no Banana ICropName).
 */
export function resolveRowCrop(
  rawCrop: string | null,
  tokens: string[],
  canonicalCrop: ICropName,
  isBeanLike: (variety: string) => boolean,
): IRowCropDecision {
  const upper = new Set(tokens.map((t) => t.toUpperCase()));
  let bananaHits = 0;
  for (const t of upper) if (BANANA_TOKENS.has(t)) bananaHits++;
  if (bananaHits >= 2) return { crop: canonicalCrop, corrected: false, reason: 'banana-mislabel' };
  const scores = new Map<ICropName, number>([
    ['rice', countMarkers(upper, RICE_MARKERS)],
    ['soya-beans', countMarkers(upper, SOYA_MARKERS)],
    ['groundnuts', countGroundnut(upper)],
    ['potato', countMarkers(upper, POTATO_MARKERS)],
  ]);
  let native = 0;
  if (canonicalCrop === 'maize') {
    native = countMaizeBrands(upper);
  } else if (canonicalCrop === 'rice') {
    native = countMarkers(upper, RICE_MARKERS);
  } else if (canonicalCrop === 'soya-beans') {
    native = countMarkers(upper, SOYA_MARKERS);
  } else if (canonicalCrop === 'groundnuts') {
    native = countGroundnut(upper);
  } else if (canonicalCrop === 'potato') {
    native = countMarkers(upper, POTATO_MARKERS);
  } else {
    // Generic crops (beans, cowpeas, ...): the shared sanitizer keeps almost
    // every token under its own crop, so `isBeanLike` alone would block every
    // correction. Count only tokens that are exclusive to this crop: markers
    // for another crop, ambiguous shared names, and breeder codes never count.
    for (const t of upper) {
      if (AMBIGUOUS_TOKENS.has(t) || isMarkerLike(t)) continue;
      if (isBeanLike(t)) native++;
    }
  }
  let best: ICropName | null = null;
  let bestScore = 0;
  let tied = false;
  for (const [crop, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      best = crop;
      tied = false;
    } else if (score === bestScore && score > 0) {
      tied = true;
    }
  }
  if (best !== null && best !== canonicalCrop && bestScore > 0 && native === 0 && !tied) {
    return {
      crop: best,
      corrected: true,
      reason: `row-crop ${rawCrop ?? '?'} overridden by ${bestScore} ${best} marker(s)`,
    };
  }
  return { crop: canonicalCrop, corrected: false, reason: '' };
}
