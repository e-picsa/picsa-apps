import { getServiceRoleClient } from '../../_shared/client.ts';
import { sendEmail } from '../../_shared/email.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';

const supabase = getServiceRoleClient();

interface RequestAccessRecord {
  id: string;
  user_id: string;
  deployment_id: string;
  status: string;
  created_at: string;
}

export const notifyRequests = async (req: Request) => {
  const payload = await req.json();
  const record: RequestAccessRecord = payload.record;

  if (!record) {
    return ErrorResponse('No record provided in webhook payload', 400);
  }

  console.log('New access request webhook received:', record);

  try {
    // 1. Get deployment details
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('label')
      .eq('id', record.deployment_id)
      .single();

    if (deploymentError) throw deploymentError;

    // 2. Get user details (requester)
    const { data: requester, error: requesterError } = await supabase.auth.admin.getUserById(record.user_id);
    if (requesterError) throw requesterError;

    const requesterEmail = requester.user.email;

    // 3. Find admins for this deployment
    const { data: allDeploymentRoles, error: allRolesError } = await supabase
      .from('user_roles')
      .select('user_id, roles')
      .eq('deployment_id', record.deployment_id);

    if (allRolesError) throw allRolesError;

    const adminUserIds = allDeploymentRoles
      .filter((r: any) => r.roles.includes('admin') || r.roles.includes('deployments.admin'))
      .map((r: any) => r.user_id);

    if (adminUserIds.length === 0) {
      console.log('No admins found for deployment', record.deployment_id);
      return JSONResponse({ message: 'No admins to notify' });
    }

    // 4. Fetch admin emails
    const adminEmails: string[] = [];
    for (const adminId of adminUserIds) {
      const { data: u, error: uError } = await supabase.auth.admin.getUserById(adminId);
      if (!uError && u.user.email) {
        adminEmails.push(u.user.email);
      }
    }

    // 5. Build and Send Email
    const emailSubject = `New Access Request for ${deployment.label}`;

    // Load HTML template from the adjacent file and inject variables
    const templateUrl = new URL('./access-request.html', import.meta.url);
    const templateHtml = await Deno.readTextFile(templateUrl);

    const emailHtml = templateHtml
      .replace('{{requesterEmail}}', requesterEmail)
      .replace('{{deploymentLabel}}', deployment.label);

    const fallbackEmail = Deno.env.get('ACCESS_REQUEST_NOTIFICATION_EMAIL');
    const recipients = fallbackEmail ? [fallbackEmail] : adminEmails;

    if (recipients.length === 0) {
      console.log('No valid email recipients found.');
      return JSONResponse({ message: 'No recipients' });
    }

    const result = await sendEmail({
      to: recipients,
      subject: emailSubject,
      html: emailHtml,
    });

    return JSONResponse(result);
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return ErrorResponse(err.message, 500);
  }
};
