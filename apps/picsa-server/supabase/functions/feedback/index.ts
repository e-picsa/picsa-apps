import { corsHeaders } from '../_shared/cors.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { getFormData } from '../_shared/request.ts';
import { getUserFromRequest, getServiceRoleClient } from '../_shared/client.ts';
import { mergeScreenPath, validateFeedbackFields, validateScreenshot, type ScreenshotFile } from './types.ts';
import { insertFeedbackReport, uploadScreenshot } from './helpers.ts';

/**
 * Handle a feedback submission (multipart form-data).
 * Exported separately so integration tests can call it directly.
 */
export async function handleFeedback(req: Request): Promise<Response> {
  if (req.method !== 'POST') return ErrorResponse('Only POST method is supported', 400);
  try {
    const form = await getFormData(req);
    const validation = validateFeedbackFields(form.fields);
    if (!validation.ok)
      return ErrorResponse(
        { message: 'Some information was missing or invalid. Please check your message and try again.' },
        400,
      );
    const { type, device_info, comment, screen_path } = validation.data;
    // Resolve user only if a bearer token is supplied; otherwise stay anonymous.
    // Skipping auth when absent avoids starting unnecessary token-refresh timers.
    const user = req.headers.has('Authorization') ? await getUserFromRequest(req) : null;
    const screenshot_path = await uploadScreenshotIfProvided(form.files.screenshot);
    try {
      // screen_path has no column of its own — persist it inside device_info.
      const deviceInfo = mergeScreenPath(device_info as Record<string, unknown>, screen_path);
      const reportId = await insertFeedbackReport({
        type,
        user_id: user?.id ?? null,
        comment,
        device_info: deviceInfo,
        screenshot_path,
      });
      return JSONResponse({ id: reportId, screenshot_path });
    } catch (err) {
      console.error('Insert failed', err);
      // Cleanup any uploaded screenshot that didn't get a row — covers insert errors
      // AND any unexpected throw between upload and insert.
      await removeScreenshotIfOrphaned(screenshot_path);
      return ErrorResponse("We couldn't save your feedback. Please try again.", 500);
    }
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Unexpected error', err);
    return ErrorResponse('Something went wrong. Please try again.', 500);
  }
}

/** Validate + upload the screenshot form file, or null when absent. Throws ErrorResponse on failure. */
async function uploadScreenshotIfProvided(file: unknown): Promise<string | null> {
  if (!file) return null;
  const screenshot = Array.isArray(file) ? file[0] : file;
  const fileError = validateScreenshot(screenshot as ScreenshotFile);
  if (fileError) throw ErrorResponse(fileError, 400);
  try {
    return await uploadScreenshot(screenshot as ScreenshotFile);
  } catch (err) {
    console.error('Screenshot upload failed', err);
    throw ErrorResponse("We couldn't upload the screenshot. Please try again.", 500);
  }
}

/** Best-effort removal of an orphaned screenshot when the DB insert failed. */
async function removeScreenshotIfOrphaned(screenshot_path: string | null): Promise<void> {
  if (!screenshot_path) return;
  try {
    await getServiceRoleClient().storage.from('feedback-screenshots').remove([screenshot_path]);
  } catch (cleanupErr) {
    console.error('Failed to remove orphaned screenshot', cleanupErr);
  }
}

// Only start the HTTP server when this module is the entry point (not when imported by tests).
if (import.meta.main) {
  Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    return handleFeedback(req);
  });
}
