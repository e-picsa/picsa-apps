/**
 * Shape returned by getFormData — matches the old multiparser `Form` type so all
 * consumers (`form.fields`, `form.files.screenshot`, etc.) continue to work.
 */
export interface FormDataResult {
  fields: Record<string, string>;
  files: Record<string, { name: string; filename: string; contentType: string; size: number; content: Uint8Array }>;
}

/**
 * Minimal multipart/form-data parser.
 * The Deno built-in `req.formData()` may fail inside the Supabase edge-runtime
 * due to how the proxy re-packages the body. This parser works directly from
 * the raw bytes and the boundary extracted from the Content-Type header.
 */
function extractBoundary(contentType: string): string | null {
  const match = /boundary=([^\s;]+)/i.exec(contentType);
  return match ? match[1] : null;
}

/** Scan the raw body for boundary delimiters and extract each part's bytes. */
function splitMultipartParts(raw: Uint8Array, boundaryBytes: Uint8Array): Uint8Array[] {
  const parts: Uint8Array[] = [];
  let pos = 0;
  while (pos < raw.length) {
    const idx = indexOf(raw, boundaryBytes, pos);
    if (idx === -1) break;
    pos = idx + boundaryBytes.length;
    // Skip CRLF after boundary
    if (pos + 1 < raw.length && raw[pos] === 0x0d && raw[pos + 1] === 0x0a) {
      pos += 2;
    }
    // Find next boundary
    const nextIdx = indexOf(raw, boundaryBytes, pos);
    if (nextIdx === -1) break;
    // Extract part (trim trailing CRLF)
    let end = nextIdx;
    if (end >= 2 && raw[end - 2] === 0x0d && raw[end - 1] === 0x0a) {
      end -= 2;
    }
    if (end > pos) {
      parts.push(raw.slice(pos, end));
    }
    pos = nextIdx + boundaryBytes.length;
  }
  return parts;
}

/** Parse a single part's headers and body. Returns null when the part has no name. */
function parsePart(
  part: Uint8Array,
  decoder: TextDecoder,
): { name: string; filename: string; contentType: string; body: Uint8Array } | null {
  // Split headers from body at double CRLF
  const doubleCRLF = new Uint8Array([0x0d, 0x0a, 0x0d, 0x0a]);
  const sepIdx = indexOf(part, doubleCRLF, 0);
  if (sepIdx === -1) return null;

  const headerBytes = part.slice(0, sepIdx);
  const bodyBytes = part.slice(sepIdx + 4);
  const headerText = decoder.decode(headerBytes);

  // Parse Content-Disposition and Content-Type from headers
  let name = '';
  let filename = '';
  let contentType = 'text/plain';
  for (const line of headerText.split('\r\n')) {
    if (line.toLowerCase().startsWith('content-disposition:')) {
      const nameMatch = /name="([^"]+)"/.exec(line);
      if (nameMatch) name = nameMatch[1];
      const fnMatch = /filename="([^"]+)"/.exec(line);
      if (fnMatch) filename = fnMatch[1];
    }
    if (line.toLowerCase().startsWith('content-type:')) {
      contentType = line.substring(line.indexOf(':') + 1).trim();
    }
  }

  if (!name) return null;

  return { name, filename, contentType, body: bodyBytes };
}

async function parseMultipartBody(raw: Uint8Array, boundary: string): Promise<FormDataResult> {
  const decoder = new TextDecoder();
  const boundaryBytes = new TextEncoder().encode(`--${boundary}`);

  const fields: Record<string, string> = {};
  const files: FormDataResult['files'] = {};

  for (const part of splitMultipartParts(raw, boundaryBytes)) {
    const parsed = parsePart(part, decoder);
    if (!parsed) continue;
    const { name, filename, contentType, body } = parsed;
    if (filename) {
      files[name] = {
        name,
        filename,
        contentType,
        size: body.byteLength,
        content: body,
      };
    } else {
      fields[name] = decoder.decode(body);
    }
  }

  return { fields, files };
}

/** Find the index of `needle` in `haystack` starting from `from`. */
function indexOf(haystack: Uint8Array, needle: Uint8Array, from: number): number {
  for (let i = from; i <= haystack.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

export const getFormData = async (req: Request): Promise<FormDataResult> => {
  const ct = req.headers.get('content-type');
  if (ct?.startsWith('multipart/form-data')) {
    try {
      // Strategy 1: Clone the request and try Deno's native formData parser
      const cloned = req.clone();
      const formData = await cloned.formData();
      const fields: Record<string, string> = {};
      const files: FormDataResult['files'] = {};
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const buffer = new Uint8Array(await value.arrayBuffer());
          files[key] = {
            name: key,
            filename: value.name,
            contentType: value.type,
            size: value.size,
            content: buffer,
          };
        } else {
          fields[key] = String(value);
        }
      }
      return { fields, files };
    } catch (nativeErr) {
      console.error('Native formData parsing failed, trying manual parse', nativeErr);
    }

    try {
      // Strategy 2: Read raw body bytes and parse multipart manually
      const boundary = extractBoundary(ct);
      if (!boundary) {
        console.error('No boundary in content-type');
        return { fields: {}, files: {} };
      }
      const cloned2 = req.clone();
      const rawBody = new Uint8Array(await cloned2.arrayBuffer());
      console.error(`Manual multipart parse: body=${rawBody.length} bytes, boundary=${boundary}`);
      const result = await parseMultipartBody(rawBody, boundary);
      console.error(`Parsed: ${Object.keys(result.fields).length} fields, ${Object.keys(result.files).length} files`);
      return result;
    } catch (manualErr) {
      console.error('Manual multipart parsing also failed', manualErr);
    }
  }
  console.error('Request does not contain form-data', req.body);
  return { fields: {}, files: {} };
};

export const getJsonData = async <T = Record<string, any>>(req: Request): Promise<T> => {
  if (req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('application/json')) {
    const json = await req.json();
    return json as T;
  }
  console.error('Request does not contain json body');
  return {} as T;
};
