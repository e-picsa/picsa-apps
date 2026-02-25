import { getServiceRoleClient, getUserFromRequest } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';

const supabaseAdmin = getServiceRoleClient();

export const joinPublicDeployment = async (req: Request) => {
  if (req.method !== 'POST') {
    return ErrorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return ErrorResponse('Unauthorized', 401);
    }

    const payload = await req.json();
    const deploymentId = payload.deployment_id;

    if (!deploymentId) {
      return ErrorResponse('Deployment ID is required', 400);
    }

    // 1. Verify deployment is public
    const { data: deployment, error: dErr } = await supabaseAdmin
      .from('deployments')
      .select('id, public')
      .eq('id', deploymentId)
      .single();

    if (dErr || !deployment) {
      return ErrorResponse('Deployment not found', 404);
    }

    if (!deployment.public) {
      return ErrorResponse('Deployment is not public', 403);
    }

    // 2. Add user to deployment with base user role using service_role to bypass RLS
    const { error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: user.id, deployment_id: deploymentId, roles: [] }, { onConflict: 'user_id, deployment_id' });

    if (roleErr) {
      console.error('Error assigning role:', roleErr);
      return ErrorResponse('Failed to assign user role', 500);
    }

    // 3. Cleanup any pending access requests for this user/deployment
    await supabaseAdmin
      .from('deployment_access_requests')
      .delete()
      .eq('user_id', user.id)
      .eq('deployment_id', deploymentId)
      .eq('status', 'pending');

    return JSONResponse({ success: true, message: 'Successfully joined public deployment' });
  } catch (err: unknown) {
    console.error('Unexpected error in joinPublicDeployment:', err);
    return ErrorResponse('Internal Server Error', 500);
  }
};
