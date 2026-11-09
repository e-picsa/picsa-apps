/**
 * Safely decodes a URI component (such as percent-encoded filenames or path segments).
 * Returns the original string if decoding fails (e.g. malformed percent encoding).
 */
export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
