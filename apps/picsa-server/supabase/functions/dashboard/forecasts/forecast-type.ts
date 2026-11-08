import type { IApiClimateForecast, IDBClimateForecastInsert } from '../types.ts';

type ForecastType = IDBClimateForecastInsert['forecast_type'];

/**
 * Map upstream email metadata to a forecast type.
 *
 * Pure module (no supabase/deno runtime deps) so the mapping can be unit tested.
 * Matching is sender-scoped: a keyword only applies to the sender it was configured for,
 * so generic words like 'bulletin' cannot leak across countries.
 */
const FORECAST_TYPE_MAPPINGS: {
  sender: string;
  subjectKeywords: string[];
  type: ForecastType;
}[] = [
  // ZM sender uses varied subjects for the 7-day outlook ('7 DAYS FORECAST',
  // 'Weekly Weather bulletin ...', sometimes RFC 2047 encoded)
  { sender: 'zambianweather@gmail.com', subjectKeywords: ['7day', 'weekly', 'bulletin'], type: 'weekly' },
  { sender: 'metmalawi.gov.mw', subjectKeywords: ['fiveday'], type: 'weekly' },
];

/**
 * Decode RFC 2047 encoded-words in email subjects
 * (e.g. `=?UTF-8?Q?Weekly_Weather_bulletin_=2D_03_to_9th?=`)
 * back to readable text. Unknown or malformed sequences pass through unchanged.
 */
export function decodeMimeSubject(subject: string): string {
  return subject.replace(
    /=\?([^?\s]+)\?([BbQq])\?([^?]*)\?=/g,
    (_match, charset: string, encoding: string, text: string) => {
      try {
        const bytes = encoding.toUpperCase() === 'B' ? base64ToBytes(text) : parseQEncoding(text);
        return new TextDecoder(charset).decode(bytes);
      } catch {
        return text;
      }
    },
  );
}

function base64ToBytes(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Q-encoding: underscores are spaces, `=XX` are hex bytes */
function parseQEncoding(text: string): Uint8Array {
  const bytes: number[] = [];
  const clean = text.replace(/_/g, ' ');
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '=' && i + 2 < clean.length && /^[0-9A-Fa-f]{2}$/.test(clean.slice(i + 1, i + 3))) {
      bytes.push(parseInt(clean.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(clean.charCodeAt(i));
    }
  }
  return new Uint8Array(bytes);
}

export function mapForecastType(apiForecast: IApiClimateForecast): ForecastType {
  const { sender, subject } = apiForecast.metadata || {};
  // Fallback assume daily
  if (!sender || !subject) {
    return 'daily';
  }
  const cleanSubject = decodeMimeSubject(subject).toLowerCase().replace(/[\s-]/g, '');
  // Use keyword mapping to try and identify type
  const mapping = FORECAST_TYPE_MAPPINGS.find(
    (m) => sender.includes(m.sender) && m.subjectKeywords.some((keyword) => cleanSubject.includes(keyword)),
  );

  return mapping?.type || 'daily';
}
