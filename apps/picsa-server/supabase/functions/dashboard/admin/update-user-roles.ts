import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { hasAuthRole } from '../../_shared/auth.ts';
import type { AppRole } from '../../../types/index.ts';

/** Update user roles for a deployment */
export const updateUserRoles = async (
  req: Request,
  params: { user_id: string; deployment_id: string; roles: AppRole[] },
) => {
  const adminClient = getServiceRoleClient();

  const { user_id, deployment_id, roles } = params;

  if (!roles || !Array.isArray(roles)) {
    return ErrorResponse('Roles array is required', 400);
  }

  // Validate that the caller has the roles they are trying to assign
  for (const role of roles) {
    const hasRole = await hasAuthRole(req, deployment_id, role);
    if (!hasRole) {
      return ErrorResponse(`Cannot assign role '${role}' as you do not possess it.`, 403);
    }
  }

  // NOTE: We do not strictly check if we are *removing* a role we don't have,
  // but generally if you can edit the user you can likely manage their roles.
  // Stricter implementation might require checking if we are removing a role we don't have permission for.
  // For now, consistent with "assign" check from prompt.

  const { data, error } = await adminClient
    .from('user_roles')
    .update({ roles })
    .match({ deployment_id, user_id })
    .select('*');

  if (error) {
    return ErrorResponse(error.message);
  }

  return JSONResponse<any>({ data });
};
