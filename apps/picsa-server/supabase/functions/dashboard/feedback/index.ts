import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { getRequestDeploymentId, hasAuthRole } from '../../_shared/auth.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { validateBody } from '../../_shared/validation.ts';
import type { AppRole } from '../../../types/index.ts';
import { listFeedbackSchema, updateFeedbackSchema, signedUrlSchema, type FeedbackReportRow } from './types.ts';

/**
 * Handle admin feedback operations.
 * Routed from dashboard/index.ts for paths `/dashboard/feedback/{endpoint}`.
 * All endpoints require `app.admin` role on the current deployment.
 */
export const feedback = async (req: Request) => {
  const { pathname } = new URL(req.url);
  const [endpoint] = pathname.replace('/dashboard/feedback/', '').split('/');

  const deploymentId = getRequestDeploymentId(req);
  if (!deploymentId) {
    return ErrorResponse('[Headers] x-picsa-deployment-id required');
  }

  const roleRequired: AppRole = 'app.admin';
  const hasPermission = hasAuthRole(req, deploymentId, roleRequired);
  if (!hasPermission) {
    return ErrorResponse(`[${roleRequired}] permission required to manage feedback`, 401);
  }

  switch (endpoint) {
    case 'list':
      return listFeedback(req);
    case 'update':
      return updateFeedback(req);
    case 'signed-url':
      return signedUrl(req);
    default:
      return ErrorResponse(`Invalid feedback endpoint: ${endpoint}`, 501);
  }
};

// ---------------------------------------------------------------------------
// Endpoint handlers
// ---------------------------------------------------------------------------

/** Query feedback_reports with optional filters, ordered by created_at desc. */
async function listFeedback(req: Request): Promise<Response> {
  try {
    const filters = await validateBody(req, listFeedbackSchema);
    const supabase = getServiceRoleClient();

    let query = (supabase as any)
      .from('feedback_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.app_version) {
      query = query.eq('device_info->>app_version', filters.app_version);
    }
    if (filters.os) {
      query = query.eq('device_info->>os', filters.os);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      return ErrorResponse(error.message);
    }
    return JSONResponse<FeedbackReportRow[]>(data || []);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return ErrorResponse('Internal Server Error', 500);
  }
}

/** Update a single feedback report row. Only provided fields are changed. */
async function updateFeedback(req: Request): Promise<Response> {
  try {
    const body = await validateBody(req, updateFeedbackSchema);
    const supabase = getServiceRoleClient();

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;

    const { data, error } = await (supabase as any)
      .from('feedback_reports')
      .update(updates)
      .eq('id', body.id)
      .select('*');

    if (error) {
      console.error(error);
      return ErrorResponse(error.message);
    }
    if (!data || data.length === 0) {
      return ErrorResponse('Feedback report not found', 404);
    }
    return JSONResponse<FeedbackReportRow>(data[0]);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return ErrorResponse('Internal Server Error', 500);
  }
}

/** Generate a short-lived signed URL for a report's screenshot. */
async function signedUrl(req: Request): Promise<Response> {
  try {
    const body = await validateBody(req, signedUrlSchema);
    const supabase = getServiceRoleClient();

    const { data, error } = await (supabase as any)
      .from('feedback_reports')
      .select('screenshot_path')
      .eq('id', body.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ErrorResponse('Feedback report not found', 404);
      }
      console.error(error);
      return ErrorResponse(error.message);
    }
    if (!data || !data.screenshot_path) {
      return ErrorResponse('No screenshot found for this report', 404);
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('feedback-screenshots')
      .createSignedUrl(data.screenshot_path, 60);

    if (urlError) {
      console.error(urlError);
      return ErrorResponse(urlError.message);
    }

    return JSONResponse({ signed_url: urlData.signedUrl, expires_in: 60 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return ErrorResponse('Internal Server Error', 500);
  }
}
