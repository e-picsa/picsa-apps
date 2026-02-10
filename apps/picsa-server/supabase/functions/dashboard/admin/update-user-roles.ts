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

  // Check current roles to see if any roles being removed
  const { data: currentUserRoles, error: fetchError } = await adminClient
    .from('user_roles')
    .select('roles')
    .match({ deployment_id, user_id })
    .single();

  if (fetchError) {
    return ErrorResponse(fetchError.message);
  }

  const currentRoles = currentUserRoles?.roles || [];
  const rolesToAdd = roles.filter((r) => !currentRoles.includes(r));
  const rolesToRemove = currentRoles.filter((r) => !roles.includes(r));

  // Check permissions for both adding and removing roles
  for (const role of [...rolesToAdd, ...rolesToRemove]) {
    const hasRole = await hasAuthRole(req, deployment_id, role);
    if (!hasRole) {
      return ErrorResponse(`Cannot modify role '${role}' as you do not possess it.`, 403);
    }
  }

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
