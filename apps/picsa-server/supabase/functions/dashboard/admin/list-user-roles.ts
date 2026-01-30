import type { Database } from '../../../types/db.types.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import type { IAdminListUserRolesResponse } from './types.ts';

// admin
type IUserRoles = Database['public']['Tables']['user_roles'];

/** List all available user roles */
export const listUserRoles = async (deployment_id: string) => {
  const adminClient = getServiceRoleClient();
  const { data, error } = await adminClient
    .from('user_roles')
    .select<'*', IUserRoles['Row']>('*')
    .eq('deployment_id', deployment_id);
  if (error) {
    console.error(error);
    return ErrorResponse(error.message);
  }
  return JSONResponse<IAdminListUserRolesResponse>(data);
};
