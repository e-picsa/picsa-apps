import { getServiceRoleClient } from '../../_shared/client.ts';
import { sendEmail } from '../../_shared/email.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { renderTemplate } from '../../_shared/template.ts';

interface RequestAccessRecord {
  id: string;
  user_id: string;
  deployment_id: string;
  status: string;
  request_message?: string;
  response_message?: string;
  created_at: string;
}

interface HandlerContext {
  record: RequestAccessRecord;
  oldRecord?: RequestAccessRecord;
  deploymentLabel: string;
  requesterEmail: string;
  fullName: string;
  organisation: string;
}

const getDashboardUrl = () => Deno.env.get('DASHBOARD_PUBLIC_URL') || 'https://dashboard.picsa.app';
const getFallbackEmail = () => Deno.env.get('DASHBOARD_ADMIN_EMAIL') || 'support@picsa.app';

const supabase = getServiceRoleClient();

export const notifyRequests = async (req: Request) => {
  const payload = await req.json();
  const record: RequestAccessRecord = payload.record;
  const oldRecord: RequestAccessRecord | undefined = payload.old_record;
  const operationType: string = payload.type || 'INSERT';

  if (!record) return ErrorResponse('No record provided in webhook payload', 400);

  try {
    const { data: deployment, error: dErr } = await supabase
      .from('deployments')
      .select('label')
      .eq('id', record.deployment_id)
      .single();
    if (dErr) throw dErr;

    const { data: requester, error: rErr } = await supabase.auth.admin.getUserById(record.user_id);
    if (rErr) throw rErr;

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, organisation')
      .eq('user_id', record.user_id)
      .single();

    const context = {
      record,
      oldRecord,
      deploymentLabel: deployment.label,
      requesterEmail: requester.user.email!,
      fullName: userProfile?.full_name || 'Unknown User',
      organisation: userProfile?.organisation || 'Unknown Organisation',
    };

    if (operationType === 'UPDATE') {
      return await handleUpdateRequest(context);
    }

    return await handleInsertRequest(context);
  } catch (err: unknown) {
    console.error('Unexpected error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return ErrorResponse(message, 500);
  }
};

// TODO - future multiple admin contact
async function getAdminEmails() {
  // const { data: roles } = await supabase
  //   .from('user_roles')
  //   .select('user_id, roles')
  //   .eq('deployment_id', record.deployment_id);
  // const adminIds = ((roles as { user_id: string; roles: string[] }[]) || [])
  //   .filter((r) => r.roles.includes('admin') || r.roles.includes('deployments.admin'))
  //   .map((r) => r.user_id);
}

async function handleUpdateRequest(ctx: HandlerContext) {
  const { record, oldRecord, deploymentLabel, requesterEmail } = ctx;
  if (!(oldRecord?.status === 'pending' && (record.status === 'approved' || record.status === 'rejected'))) {
    return JSONResponse({ message: 'Update handled, no relevant status change.' });
  }

  const responseMessageBlock = record.response_message
    ? `<div style="padding:15px; background:#f3f4f6; border-left:4px solid #2563eb; margin:20px 0; font-style:italic;">"${record.response_message}"</div>`
    : '<p><em>No additional reasoning provided.</em></p>';

  const html = await renderTemplate('./access-response.html', import.meta.url, {
    deploymentLabel,
    status: record.status,
    publicUrl: getDashboardUrl(),
    responseMessage: responseMessageBlock,
  });
  const emailRes = await sendEmail({
    to: requesterEmail,
    subject: `Access Request ${record.status === 'approved' ? 'Approved' : 'Rejected'} for ${deploymentLabel}`,
    html,
  });
  return JSONResponse(emailRes);
}

async function handleInsertRequest(ctx: HandlerContext) {
  const { record, deploymentLabel, requesterEmail, fullName, organisation } = ctx;

  // if (adminIds.length === 0) return JSONResponse({ message: 'No admins to notify' });

  const requestMessageBlock = record.request_message
    ? `<div style="padding:15px; background:#f3f4f6; border-left:4px solid #2563eb; margin:20px 0; font-style:italic;">"${record.request_message}"</div>`
    : '<p><em>No additional reason provided.</em></p>';

  const html = await renderTemplate('./access-request.html', import.meta.url, {
    requesterEmail,
    fullName,
    organisation,
    deploymentLabel,
    publicUrl: getDashboardUrl(),
    requestMessage: requestMessageBlock,
  });

  const emailRes = await sendEmail({
    to: getFallbackEmail(),
    subject: `New Access Request for ${deploymentLabel}`,
    html,
  });

  return JSONResponse(emailRes);
}
