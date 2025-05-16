import { Database } from '../../../types/db.types.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';

/** List all available authentication users */
export const removeUser = async (params: { user_id: string; deployment_id: string }) => {
  const adminClient = getServiceRoleClient();

  const { user_id, deployment_id } = params;

  const { data: targetUser, error: targetUserError } = await adminClient
    .from('user_roles')
    .select<'*', Database['public']['Tables']['user_roles']['Row']>('*')
    .match({ deployment_id, user_id })
    .single();
  if (targetUserError) {
    console.error(targetUserError);
    return ErrorResponse(targetUserError.message);
  }
  if (!targetUser) {
    return ErrorResponse(`Target user not found: ${deployment_id}/${user_id}`);
  }
  const { roles } = targetUser;
  if (roles.includes('admin') || roles.includes('deployments.admin')) {
    return ErrorResponse(`Cannot remove admin user`);
  }

  const { data, error } = await adminClient.from('user_roles').delete().match({ deployment_id, user_id });
  if (error) {
    console.error(error);
    return ErrorResponse(error.message);
  }

  return JSONResponse(data);
};
