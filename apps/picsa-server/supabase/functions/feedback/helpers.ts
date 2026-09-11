import { getServiceRoleClient } from '../_shared/client.ts';
import { extensionFor, type DeviceInfo, type ScreenshotFile } from './types.ts';

/**
 * Upload a screenshot to the private `feedback-screenshots` bucket.
 * Returns the storage path (e.g. `reports/<uuid>.png`).
 */
export async function uploadScreenshot(file: ScreenshotFile): Promise<string> {
  const ext = extensionFor(file.contentType);
  const path = `reports/${crypto.randomUUID()}.${ext}`;
  const supabase = getServiceRoleClient();
  const { error } = await supabase.storage
    .from('feedback-screenshots')
    .upload(path, file.content, { contentType: file.contentType, upsert: false });
  if (error) {
    throw error;
  }
  return path;
}

/** Shape of a `feedback_reports` row insert (table not yet in generated types). */
type FeedbackReportInsert = {
  type: 'feedback' | 'bug_report';
  user_id: string | null;
  comment: string;
  device_info: DeviceInfo;
  screenshot_path: string | null;
};

/**
 * Insert a feedback report row and return the new report id.
 *
 * `feedback_reports` is not yet in the generated `Database` types (type
 * regeneration is a separate step), so the query is cast to `any` here.
 */
export async function insertFeedbackReport(data: FeedbackReportInsert): Promise<string> {
  const supabase = getServiceRoleClient();
  const { data: row, error } = await (supabase as any)
    .from('feedback_reports')
    .insert({
      type: data.type,
      user_id: data.user_id,
      comment: data.comment,
      device_info: data.device_info,
      screenshot_path: data.screenshot_path,
    })
    .select('id')
    .single();
  if (error) {
    throw error;
  }
  return row.id;
}
