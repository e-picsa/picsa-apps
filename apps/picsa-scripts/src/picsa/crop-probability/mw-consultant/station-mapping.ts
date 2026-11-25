/**
 * Station resolution for MW consultant EPA blocks.
 *
 * The consultant `mw-probabilities.xlsx` names Cropwat stations per EPA block
 * (165 distinct names). The `station_id` FK targets `climate_stations.id`
 * (`mw/<slug>`). Resolution order per block:
 *
 * 1. Direct normalized match against `climate_stations` (`station_id` or
 *    `station_name`).
 * 2. Docx hint — `mw-station-mapping.docx` (worktree root) maps each current
 *    PICSA MET station to its consultant Excel station names (parsed below, no
 *    runtime docx dependency). The hint's MET station is then matched to
 *    `climate_stations` the same way.
 * 3. Coordinates tiebreaker — nearest `climate_stations` row by haversine to the
 *    block lat/lon (prefer same district, 100 km cap).
 *
 * Every decision is logged with its method so the audit report shows how each
 * `station_id` was derived.
 */

export interface IClimateStationRef {
  id: string;
  station_id: string;
  station_name: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type StationResolutionMethod = 'direct' | 'docx-hint' | 'coordinates' | 'unresolved';

export interface IStationResolution {
  station_id: string | null;
  method: StationResolutionMethod;
  detail: string;
}

/** Normalise for station name comparison */
export function normalizeStationName(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = String(raw).toLowerCase().trim();
  s = s.replace(/[\u2019']/g, '');
  s = s
    .replace(/\bmet(\s+station)?\b/g, ' ')
    .replace(/\bstation\b/g, ' ')
    .replace(/\bagric(\s+research)?\b/g, ' ')
    .replace(/\bagriculture\b/g, ' ')
    .replace(/\bresearch\b/g, ' ')
    .replace(/\bboma\b/g, ' ')
    .replace(/\baerodrome\b/g, ' ')
    .replace(/\bairport\b/g, ' ')
    .replace(/\bmission\b/g, ' ')
    .replace(/\brtc\b/g, ' ')
    .replace(/\birrigation(\s+scheme)?\b/g, ' ')
    .replace(/\bdistrict\b/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return s;
}

/**
 * Docx table parsed from `mw-station-mapping.docx` (worktree root):
 * canonical PICSA MET station -> consultant Excel station spellings.
 * Keys/values are raw strings; matching uses {@link normalizeStationName}.
 */
export const DOCX_MET_TO_EXCEL: Record<string, string[]> = {
  Chitipa: ['Chitipa', 'Lufita', 'Chisenga'],
  Karonga: ['Lupembe', 'Kaporo', 'Nyungwe', 'Baka', 'Kapolo', 'Vinthukutu'],
  Bolero: ['Bolero Met Station', 'Rumphi Boma', 'Ntchenachena', 'Vwaza', 'Muhuju', 'Mzokoto'],
  Mzuzu: ['Mzuzu Met Station', 'Bwengu', 'Mpherembe', 'Emfeni', 'Kafukule', 'Zombwe'],
  Luwazi: ['Luwalazi Met Station'],
  'Nkhata-Bay': ['Luwalazi', 'Kawalazi', 'Mzenga', 'Bulala', 'Mpono'],
  Mzimba: ['Mzimba Boma', 'Emsizini', 'Mbawa', 'Euthini', 'Jenda', 'Kazuni', 'Vibangalala'],
  Nkhotakota: ['Nkhotakota Boma', 'Linga', 'Mwansambo'],
  Kasungu: ['Chipala', 'Lisasadzi', 'Chulu', 'Kaluluma', 'Santhe', 'chamama', 'Malomo', 'Mpalonthesa'],
  // 'Nambuwa' is the docx spelling; 'Nambuma' added — every other name in this
  // list is a Dowa-sheet block, so the docx entry is almost certainly that typo.
  Mponela: ['Mponela RTC', 'Chisepo', 'Madise', 'Mndolera', 'Nambuwa', 'Nambuma', 'Bowe', 'Chibvala'],
  'Dowa Agriculture': ['Dowa Boma', 'Nachisaka', 'Nalunga', 'Malambo', 'Ntchisi rain Forest'],
  Nalunga: ['Nalunga'],
  Kamuona: ['Kamuona'],
  Salima: ['Salima Airport', 'Lifuwu Research', 'Khombeza', 'Chitala', 'Matenje'],
  Chitedze: ['Chitedze Met Station', 'Chileka- Lilongwe', 'Kasiya', 'Mkanda', 'Mlonyeni', 'Zulu', 'Mikundi', 'Chiosya'],
  Bunda: ['Bunda Met Station', 'Mkwinda', 'Nathenje'],
  Chipoka: ['Chipoka'],
  Mtakataka: ['Golomoti Met Station', 'Mayani Met Station', 'Bembeke Met Station'],
  Dedza: ['Dedza Boma Met Station', 'Bembeke', 'Lobi', 'Kabwazi', 'Chafumbwa'],
  'Monkey Bay': ['Nankumba', 'Lungwena', 'Makanjira', 'Mlowe'],
  Golomoti: ['Golomoti Met Station'],
  Mangochi: ['Nsanama', 'Lungwena', 'Namwera', 'Chilipa'],
  Ntaja: ['Ntaja', 'Nampeya', 'Mtubwi', 'Ngokwe', 'Nyambi', 'Chikwewo', 'Nsanama'],
  Makoka: ['Mulombozi Met Station', 'Zomba RTC Met Station', 'Dzaone', 'Nsondole', 'Malosa', 'Likangala'],
  Chiradzulu: ['Mulombozi Met Station', 'Lunzu', 'Mikolongwe Met Station', 'Mbulumbuzi', 'Mombezi'],
  Chichiri: ['Ntonda', 'Lunzu', 'Mikolongwe', 'Lirangwe', 'Kunthembwe'],
  Bvumbwe: ['Ntonda', 'Matapwata', 'Mikolongwe Met Station', 'Khonjeni'],
  Mimosa: [
    'Mulanje Boma',
    'Waluma Met Station',
    'Chitakale',
    'Milonde',
    'Thyolo Boma',
    'Mphinda',
    'Naminjiwa',
    'Nkhulambe',
    'Chiringa',
    'Waluma',
    'Kasongo',
    'Rivunzu',
  ],
  Chapananga: ['Chapananga Met Station', 'Changoyima', 'Changoima Met Station'],
  Ndakwera: ['Ndakwera', 'Nyachilenda', 'Makhanga', 'Tengani', 'Ndamera', 'Nchalo'],
  Ngabu: ['Ngabu', 'Bangula', 'Nchalo'],
  KIA: ['KIA', 'Chigonthi', 'Nkhoma', 'Chwamba', 'Chiwamba Met Station', 'Nkhoma Met Station'],
  Chikwawa: ['Chikwawa Boma', 'Alumenda', 'Kasinthula', 'Alumenda Met Station', 'Kasinthula EPA'],
};

/** Inverted index: normalized excel name -> docx MET station(s) */
const EXCEL_TO_MET = (() => {
  const idx: Record<string, string[]> = {};
  for (const [met, excelNames] of Object.entries(DOCX_MET_TO_EXCEL)) {
    for (const raw of excelNames) {
      const key = normalizeStationName(raw);
      if (!key) continue;
      idx[key] ??= [];
      if (!idx[key].includes(met)) idx[key].push(met);
    }
  }
  return idx;
})();

export function getDocxMetHint(excelStation: string | null | undefined): string[] {
  const key = normalizeStationName(excelStation);
  if (!key) return [];
  // Exact lookup only. Fuzzy matching is deliberately NOT attempted here:
  // Malawi place names collide within edit distance 2 across hundreds of
  // kilometres (Chifunga/Neno vs Chisenga/Chitipa, 672 km; Chiwembu/Mwanza vs
  // Chiwamba/Lilongwe, 218 km). Unmatched stations fall through to the
  // audited coordinate tiebreaker in resolveStationId instead.
  return EXCEL_TO_MET[key] ?? [];
}

/** Light normalization for token-overlap scoring: keeps every word (met, station,
 * airport...) so generic single-token overlaps (e.g. 'bay') score low. */
export function normalizeStationNameLight(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw)
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Generic station words ignored when comparing concatenated names. */
const GENERIC_STATION_WORDS = new Set([
  'met',
  'station',
  'agric',
  'research',
  'agriculture',
  'boma',
  'aerodrome',
  'airport',
  'mission',
  'rtc',
  'irrigation',
  'scheme',
  'district',
]);

export function findStationByName(
  raw: string,
  stations: IClimateStationRef[],
  dataStationIds?: Set<string>,
): IClimateStationRef | null {
  const key = normalizeStationName(raw);
  if (!key) return null;
  // Gather scored candidates: exact slug (2) > exact/nospace name (1.5) > token overlap (0..1)
  const scored: { s: IClimateStationRef; score: number }[] = [];
  const slugKey = key.replace(/[\s-]+/g, '_');
  const flatKey = key.replace(/[\s_-]+/g, '');
  const queryLight = new Set(normalizeStationNameLight(raw).split(' ').filter(Boolean));
  for (const s of stations) {
    if (s.station_id.toLowerCase() === slugKey) {
      scored.push({ s, score: 2 });
      continue;
    }
    const candNorm = normalizeStationName(s.station_name);
    // Exact normalized-name match, but only when the candidate adds no new
    // significant words (stop-word stripping equates 'Chileka' with
    // 'CHILEKA AIRPORT' — the subset check rejects that: {chileka,airport} ⊄ {chileka}).
    // The nospace form additionally equates multi-word queries with concatenated
    // station names ('Nkhata Bay' with 'NKHATABAY MET'). Single-token queries
    // never take the nospace path (that would re-admit the Chileka case).
    const candFlat = candNorm.replace(/[\s_-]+/g, '');
    if (candNorm === key || (candFlat !== '' && candFlat === flatKey)) {
      const candLight = new Set(normalizeStationNameLight(s.station_name).split(' ').filter(Boolean));
      const subset = [...candLight].every((t) => queryLight.has(t));
      if (subset) {
        scored.push({ s, score: 1.5 });
        continue;
      }
      // Concatenated station name (e.g. NKHATABAY MET -> {nkhatabay, met}):
      // compare significant light tokens joined without spaces. Both sides drop
      // generic words first so 'nkhatabay' can meet 'nkhata bay'.
      if (candFlat === flatKey && queryLight.size > 1) {
        const flatSig = (lights: Set<string>): string =>
          [...lights].filter((t) => !GENERIC_STATION_WORDS.has(t)).join('');
        if (flatSig(candLight) !== '' && flatSig(candLight) === flatSig(queryLight)) {
          scored.push({ s, score: 1.5 });
          continue;
        }
      }
    }
    const tokens = new Set(key.split(' ').filter(Boolean));
    const candTokens = new Set(candNorm.split(' ').filter(Boolean));
    if (tokens.size === 0 || candTokens.size === 0) continue;
    let overlap = 0;
    for (const t of tokens) if (candTokens.has(t)) overlap++;
    const score = overlap / Math.max(tokens.size, candTokens.size);
    // Accept when strip-tokens strongly agree, OR the light-token names nest
    // (e.g. query {kia} ⊆ candidate {kamuzu, airport, kia}; or candidate
    // {dedza} ⊆ query {dedza, boma, met, station}). A single shared generic
    // token with no nesting (e.g. 'bay' in 'nkhata bay'/'monkey bay') matches neither.
    const lightCand = new Set(normalizeStationNameLight(s.station_name).split(' ').filter(Boolean));
    const nest = [...queryLight].every((t) => lightCand.has(t)) || [...lightCand].every((t) => queryLight.has(t));
    if (overlap >= 2 || score > 0.5 || (overlap >= 1 && nest)) scored.push({ s, score });
  }
  if (scored.length === 0) return null;
  // Prefer stations with climate data (tables can actually generate). The base-name
  // station often exists but carries empty data columns while a suffixed sibling
  // (e.g. mw/dedza vs mw/dedza_met) holds the series.
  const hasData = (id: string): boolean => (dataStationIds ? dataStationIds.has(id) : true);
  scored.sort((a, b) => Number(hasData(b.s.id)) - Number(hasData(a.s.id)) || b.score - a.score);
  return scored[0].s;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/**
 * Verified station homonyms: the consultant station name collides with a
 * same-named climate station hundreds of kilometres away, so name stages are
 * skipped and the audited coordinate tiebreaker decides.
 * - `9. Lilongwe District::chileka`: consultant "Chileka Met Station" serves
 *   Chileka EPA, Lilongwe (-14.02, 33.38). The only "Chileka" in
 *   climate_stations is Chileka Airport, Blantyre (~250 km south) — a
 *   different place sharing the name.
 */
export const STATION_NAME_OVERRIDES: Record<string, 'coordinates'> = {
  '9. Lilongwe District::chileka': 'coordinates',
};

/**
 * Resolve an EPA block's excel station to a `climate_stations.id`.
 * Pure function over a caller-supplied station list (fetched from Supabase).
 */
export function resolveStationId(
  excelStation: string | null | undefined,
  latitude: number | null,
  longitude: number | null,
  stations: IClimateStationRef[],
  dataStationIds?: Set<string>,
  district?: string | null,
  blockKey?: string | null,
): IStationResolution {
  const label = (excelStation ?? '').trim() || '(blank)';
  const hasData = (id: string): boolean => (dataStationIds ? dataStationIds.has(id) : true);
  const sameDistrict = (s: IClimateStationRef): boolean =>
    !!district && (s.district ?? '').toLowerCase() === district.toLowerCase();
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  // Block-to-station distance for audit transparency on every name match
  const distNote = (s: IClimateStationRef): string => {
    if (!hasCoords || typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return '';
    return `, ${haversineKm(latitude as number, longitude as number, s.latitude, s.longitude).toFixed(1)} km block-to-station`;
  };
  // 1. Direct match (a dataless match falls through: it can never generate a table).
  // Verified homonyms (STATION_NAME_OVERRIDES) skip name stages entirely.
  const skipNames = !!blockKey && STATION_NAME_OVERRIDES[blockKey] === 'coordinates';
  const direct = skipNames ? null : findStationByName(excelStation ?? '', stations, dataStationIds);
  if (direct && hasData(direct.id)) {
    return {
      station_id: direct.id,
      method: 'direct',
      detail: `${label} -> ${direct.id} (name match${distNote(direct)})`,
    };
  }
  // 2. Docx hint -> climate_stations. When an excel name is listed under several
  // MET stations (e.g. Nsanama under Mangochi and Ntaja), prefer the hint whose
  // station sits in the block's own district.
  const hinted: { met: string; s: IClimateStationRef }[] = [];
  if (!skipNames) {
    for (const met of getDocxMetHint(excelStation)) {
      const hit = findStationByName(met, stations, dataStationIds);
      if (hit && hasData(hit.id) && !hinted.some((h) => h.s.id === hit.id)) hinted.push({ met, s: hit });
    }
  }
  if (hinted.length > 0) {
    const best = [...hinted].sort((a, b) => Number(sameDistrict(b.s)) - Number(sameDistrict(a.s)))[0];
    const via = hinted.length > 1 ? ` (of ${hinted.map((h) => `${h.met}->${h.s.id}`).join('; ')})` : '';
    return {
      station_id: best.s.id,
      method: 'docx-hint',
      detail: `${label} -> docx MET ${best.met} -> ${best.s.id}${via}${distNote(best.s)}`,
    };
  }
  // 3. Coordinates tiebreaker: nearest station with data (district-agnostic —
  // proximity already encodes agro-ecological similarity; district logged for review)
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    let pool = stations.filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number');
    if (pool.length === 0) {
      return { station_id: null, method: 'unresolved', detail: `${label}: no station coordinates available` };
    }
    if (dataStationIds) {
      const withData = pool.filter((s) => dataStationIds.has(s.id));
      if (withData.length > 0) pool = withData;
    }
    const ranked = pool
      .map((s) => ({ s, d: haversineKm(latitude, longitude, s.latitude as number, s.longitude as number) }))
      .sort((a, b) => a.d - b.d);
    const nearest = ranked[0];
    if (nearest && nearest.d <= 100) {
      return {
        station_id: nearest.s.id,
        method: 'coordinates',
        detail: `${label} -> ${nearest.s.id} (nearest with data, ${nearest.d.toFixed(1)} km, district ${nearest.s.district ?? '?'})`,
      };
    }
    return { station_id: null, method: 'unresolved', detail: `${label}: nearest station >100 km` };
  }
  return { station_id: null, method: 'unresolved', detail: `${label}: no name match and no coordinates` };
}
