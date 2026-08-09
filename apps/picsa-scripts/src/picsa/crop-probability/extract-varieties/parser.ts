import { cleanRawVarietyEntryString, formatVarietyId } from './cleaning-rules';

export interface IDaysRange {
  days_lower: number;
  days_upper: number;
  raw: string;
}

export interface IParsedVariety {
  variety: string;
  local_name?: string;
  raw_token: string;
}

export interface IParsedVarietyOccurrence {
  country: string;
  station_id: string;
  station_name: string;
  crop: string;
  variety: string;
  local_name?: string;
  raw_variety_entry: string;
  days: IDaysRange;
  water: number;
}

/**
 * Rounds a number to the nearest multiple of n (e.g. 5 or 0.1).
 * Duplicated from apps/picsa-apps/dashboard/src/app/modules/crop-information/utils/probability.utils.ts
 */
export function roundToNearest(value: number, n: number): number {
  if (!value && value !== 0) return value;
  return Math.round(value / n) * n;
}

/**
 * Parses raw days string or number into lower and upper bounds, rounded to nearest 5.
 * Examples:
 *  "90" -> { days_lower: 90, days_upper: 90 }
 *  "(90)" -> { days_lower: 90, days_upper: 90 }
 *  "120 - 135" -> { days_lower: 120, days_upper: 135 }
 *  "94" -> { days_lower: 95, days_upper: 95 }
 */
export function parseDaysRange(rawInput: string | number | null | undefined): IDaysRange {
  if (rawInput === null || rawInput === undefined) {
    return { days_lower: 0, days_upper: 0, raw: '' };
  }
  const str = String(rawInput).trim();
  const cleaned = str.replace(/[()"]/g, '').trim();

  let lower = 0;
  let upper = 0;

  const rangeMatch = cleaned.match(/^(\d+)\s*(?:-|–|—|\bto\b|\bTO\b)\s*(\d+)$/i);
  if (rangeMatch) {
    const rawLower = parseInt(rangeMatch[1], 10);
    const rawUpper = parseInt(rangeMatch[2], 10);
    lower = Math.min(rawLower, rawUpper);
    upper = Math.max(rawLower, rawUpper);
  } else {
    const singleMatch = cleaned.match(/\d+/);
    if (singleMatch) {
      const num = parseInt(singleMatch[0], 10);
      lower = num;
      upper = num;
    }
  }

  const roundedLower = roundToNearest(lower, 5);
  const roundedUpper = roundToNearest(upper, 5);

  return {
    days_lower: roundedLower,
    days_upper: roundedUpper,
    raw: str,
  };
}

function extractPrefix(token: string): string | null {
  // Common brand prefix patterns: SC, PAN, PAN4M, MH, DK, DKC, MRI, PHB, ZM, KC, CAP, IT, SPV, SV, PMV, FMV, CBC, CDT, PGS
  const match = token.match(/^([A-Z0-9]{1,8}?)(?=[-\s]?\d+)/i);
  if (match) {
    const p = match[1].toUpperCase();
    if (!/^\d+$/.test(p)) {
      return p;
    }
  }
  return null;
}

function formatVarietyName(baseToken: string, prefixOverride?: string | null): string {
  let text = baseToken.trim();

  // If token starts with number and we have a carried-over prefix, prepend it
  if (/^\d+/.test(text) && prefixOverride) {
    text = `${prefixOverride}-${text}`;
  }

  // Use formatVarietyId for UPPERCASE and replacing all spaces with hyphens
  return formatVarietyId(text);
}

/**
 * Splits complex variety string entries into individual crop varieties.
 * - Applies cleaning rules (prefix splitting, AND/OR splitting, artifact filtering).
 * - Extracts local names inside brackets `(Mbidzi)` separately.
 * - Carries over brand prefixes to subsequent number-led tokens.
 * - Ensures NO spaces in variety names (e.g. PEACOCK 10 -> PEACOCK-10).
 */
export function parseVarietyString(rawInput: string): IParsedVariety[] {
  if (!rawInput || typeof rawInput !== 'string') return [];

  // Run pre-processing cleaning rules
  let text = cleanRawVarietyEntryString(rawInput);
  if (!text) return [];

  // Normalize newlines and tabs to commas
  text = text.replace(/[\r\n\t]+/g, ', ');

  // Fix boundary issues like ")or " or ")or" -> ") or "
  text = text.replace(/\)(\s*or\s*|\s*OR\s*)/gi, ') or ');

  // Protect commas and "or" inside parentheses so we don't split nested parenthetical content
  text = text.replace(/\(([^)]+)\)/g, (match, contents) => {
    const protectedContents = contents.replace(/,/g, '___COMMA___').replace(/\s+or\s+/gi, ' ___OR___ ');
    return `(${protectedContents})`;
  });

  // Split by comma, semicolon, or word-boundary "or" / "OR"
  const rawTokens = text.split(/(?:,|\s*;\s*|\s+\b(?:or|OR)\b\s+)/);

  const results: IParsedVariety[] = [];
  let lastPrefix: string | null = null;

  for (let rawToken of rawTokens) {
    // Unmask protected parens
    let unmasked = rawToken
      .replace(/___COMMA___/g, ',')
      .replace(/___OR___/gi, 'or')
      .trim();

    // Strip leading/trailing 'or' or punctuation
    unmasked = unmasked
      .replace(/^(?:or|OR)\s+/, '')
      .replace(/\s+(?:or|OR)$/, '')
      .replace(/^[\s,;-]+|[\s,;-]+$/g, '')
      .trim();

    if (!unmasked) continue;

    // Extract local_name inside parentheses if present (e.g. "SC 423 (Kanyani)" or "725 Njovu")
    let localName: string | undefined = undefined;
    let baseNameToken = unmasked;

    const parenMatch = unmasked.match(/\(([^)]+)\)/);
    if (parenMatch) {
      localName = parenMatch[1].trim().toUpperCase();
      baseNameToken = unmasked.replace(/\([^)]+\)/, '').trim();
    } else {
      // Check for unparenthesized local name suffix after numbers (e.g. "725 Njovu" -> local_name="NJOVU", base="725")
      const trailingNameMatch = unmasked.match(/^(\d+[A-Z0-9-]*)\s+([A-Za-z]+)$/);
      if (trailingNameMatch) {
        baseNameToken = trailingNameMatch[1];
        localName = trailingNameMatch[2].toUpperCase();
      }
    }

    // Check for prefix in baseNameToken
    const detectedPrefix = extractPrefix(baseNameToken);
    if (detectedPrefix) {
      lastPrefix = detectedPrefix;
    }

    // Format variety name using detected or carried over prefix
    const finalVarietyName = formatVarietyName(baseNameToken, lastPrefix);

    if (finalVarietyName && finalVarietyName !== '…' && !results.some((r) => r.variety === finalVarietyName)) {
      results.push({
        variety: finalVarietyName,
        local_name: localName,
        raw_token: rawToken,
      });
    }
  }

  return results;
}
