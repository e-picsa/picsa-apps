import { z } from 'npm:zod@4/v4';

/** Max screenshot size in bytes (10MB) */
export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

/** Allowed screenshot content types */
export const ALLOWED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** File signatures used to verify uploaded bytes match the declared image type. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46]; // 'RIFF' + 'WEBP' at offset 8

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.byteLength < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

function isValidImageBytes(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === 'image/png') return matchesSignature(bytes, PNG_SIGNATURE);
  if (contentType === 'image/jpeg') return matchesSignature(bytes, JPEG_SIGNATURE);
  if (contentType === 'image/webp') {
    return (
      matchesSignature(bytes, WEBP_SIGNATURE) &&
      bytes.byteLength >= 12 &&
      String.fromCodePoint(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP'
    );
  }
  return false;
}

/**
 * Parsed, validated feedback payload ready for insertion.
 *
 * NOTE: `screen_path` has no dedicated column — it is merged into
 * `device_info` (see `mergeScreenPath`) so it is preserved in the jsonb.
 */
export interface FeedbackPayload {
  type: 'feedback' | 'bug_report';
  user_id: string | null;
  comment: string;
  device_info: DeviceInfo;
  screenshot_path: string | null;
}

/** Keys the device_info jsonb may hold (all optional strings). */
export interface DeviceInfo {
  app_version?: string;
  os?: string;
  os_version?: string;
  device_model?: string;
  screen_size?: string;
  network_status?: string;
  locale?: string;
  device_id?: string;
  /** Merged in from the top-level `screen_path` form field. */
  screen_path?: string;
}

/** Raw file shape returned by the multiparser `FormFile` type. */
export interface ScreenshotFile {
  name: string;
  filename: string;
  contentType: string;
  size: number;
  content: Uint8Array;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Max length of the raw device_info JSON string (defense against oversized payloads). */
const MAX_DEVICE_INFO_STRING = 4096;

const deviceInfoSchema = z.strictObject({
  app_version: z.string().max(64).optional(),
  os: z.string().max(64).optional(),
  os_version: z.string().max(64).optional(),
  device_model: z.string().max(64).optional(),
  screen_size: z.string().max(64).optional(),
  network_status: z.string().max(64).optional(),
  locale: z.string().max(64).optional(),
  device_id: z.string().max(64).optional(),
});

/** device_info arrives as a JSON string; parse + validate it. */
const deviceInfoFromString = z.string().transform((val, ctx) => {
  if (val.length > MAX_DEVICE_INFO_STRING) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'device_info exceeds max length' });
    return z.NEVER;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(val);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'device_info must be valid JSON' });
    return z.NEVER;
  }
  const result = deviceInfoSchema.safeParse(parsed);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join('.')).join(', ');
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `device_info contains invalid fields${paths ? ': ' + paths : ''}`,
    });
    return z.NEVER;
  }
  return result.data;
});

/** Schema applied to the string fields extracted from multipart form-data. */
export const feedbackFieldSchema = z.object({
  type: z.enum(['feedback', 'bug_report']),
  comment: z.string().trim().min(1).max(2000),
  // Coerce an omitted device_info to the default empty object (cannot use .default() after .transform()).
  device_info: deviceInfoFromString.optional().transform((val) => val ?? ({} as DeviceInfo)),
  screen_path: z.string().max(200).optional(),
});

export type FeedbackFieldInput = z.infer<typeof feedbackFieldSchema>;

/** Shape returned by z.flattenError in zod v4. */
export type FlattenedError = ReturnType<typeof z.flattenError>;

/**
 * Validate the string fields from a multipart form.
 * Returns the flattened zod error on failure, or the parsed data on success.
 */
export function validateFeedbackFields(fields: Record<string, string>):
  | {
      ok: true;
      data: FeedbackFieldInput;
    }
  | {
      ok: false;
      errors: FlattenedError;
    } {
  const result = feedbackFieldSchema.safeParse(fields);
  if (!result.success) {
    return { ok: false, errors: z.flattenError(result.error) };
  }
  return { ok: true, data: result.data };
}

/** Validate a screenshot file's content type and size. Error message or null. */
export function validateScreenshot(file: ScreenshotFile): string | null {
  if (!file.contentType.startsWith('image/') || !ALLOWED_SCREENSHOT_TYPES.includes(file.contentType as any)) {
    return "This file type isn't supported. Please use PNG, JPG or WebP.";
  }
  if (file.content.byteLength > MAX_SCREENSHOT_BYTES) {
    return 'That image is too large (maximum 10 MB). Please choose a smaller one.';
  }
  if (!isValidImageBytes(file.content, file.contentType)) {
    return "That file doesn't appear to be a valid image. Please try a different one.";
  }
  return null;
}

/** Resolve a file extension for the storage path from the content type. */
export function extensionFor(contentType: string): string {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/webp') return 'webp';
  return 'png';
}

/** Merge the top-level screen_path into device_info before insert. */
export function mergeScreenPath(device_info: DeviceInfo, screen_path?: string): DeviceInfo {
  if (!screen_path) return device_info;
  return { ...device_info, screen_path };
}
