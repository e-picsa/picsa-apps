import type { Database } from '../../../types/db.types.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { hasAuthRole } from '../../_shared/auth.ts';
import type { AppRole } from '../../../types/index.ts';

/** List all available authentication users */
export const addUser = async (req: Request, params: { user_id: string; deployment_id: string; roles?: AppRole[] }) => {
  const adminClient = getServiceRoleClient();

  const { user_id, deployment_id, roles = ['viewer'] } = params;

  // Validate that the caller has the roles they are trying to assign
  for (const role of roles) {
    const hasRole = await hasAuthRole(req, deployment_id, role);
    if (!hasRole) {
      return ErrorResponse(`Cannot assign role '${role}' as you do not possess it.`, 403);
    }
  }

  const entry: Database['public']['Tables']['user_roles']['Insert'] = { deployment_id, roles, user_id };
  const { data, error } = await adminClient.from('user_roles').insert(entry).select('*');
  if (error) {
    if (error.code === '23505') {
      // Unique violation
      return ErrorResponse('User already exists in this deployment', 409);
    }
    return ErrorResponse(error.message);
  }
  return JSONResponse<any>({ data });
};
