import { getServiceRoleClient } from '../../_shared/client.ts';
import { sendEmail } from '../../_shared/email.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';

interface RequestAccessRecord {
  id: string;
  user_id: string;
  deployment_id: string;
  status: string;
  request_message?: string;
  created_at: string;
}

export const notifyRequests = async (req: Request) => {
  const supabase = getServiceRoleClient();
  const payload = await req.json();
  const record: RequestAccessRecord = payload.record;

  if (!record) {
    return ErrorResponse('No record provided in webhook payload', 400);
  }

  try {
    // 1. Get deployment details
    const { data: deployment, error: deploymentError } = await supabase
      .from('deployments')
      .select('label')
      .eq('id', record.deployment_id)
      .single();

    if (deploymentError) throw deploymentError;

    // 2. Get user details (requester auth + profile)
    const { data: requester, error: requesterError } = await supabase.auth.admin.getUserById(record.user_id);
    if (requesterError) throw requesterError;

    const requesterEmail = requester.user.email;

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, organisation')
      .eq('user_id', record.user_id)
      .single();

    // We don't want to throw an error if profile is missing, just default to unkown
    const fullName = userProfile?.full_name || 'Unknown User';
    const organisation = userProfile?.organisation || 'Unknown Organisation';

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

    let emailHtml = templateHtml
      .replace('{{requesterEmail}}', `${requesterEmail}`)
      .replace('{{fullName}}', `${fullName}`)
      .replace('{{organisation}}', `${organisation}`)
      .replace('{{deploymentLabel}}', `${deployment.label}`)
      .replace('{{publicUrl}}', Deno.env.get('DASHBOARD_PUBLIC_URL') || 'https://dashboard.picsa.app');

    // If there is a request message, show it, otherwise omit the message block or show "No reason"
    const requestMessageBlock = record.request_message
      ? `<div style="padding:15px; background:#f3f4f6; border-left:4px solid #2563eb; margin:20px 0; font-style:italic;">"${record.request_message}"</div>`
      : '<p><em>No additional reason provided.</em></p>';

    emailHtml = emailHtml.replace('{{requestMessage}}', requestMessageBlock);

    const fallbackEmail = Deno.env.get('DASHBOARD_ADMIN_EMAIL') || 'support@picsa.app';
    // TODO - include more recipients once tested working
    // const recipients = fallbackEmail ? [fallbackEmail] : adminEmails;
    const recipients = fallbackEmail;

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
