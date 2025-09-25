import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { IAdminListUsersResponse } from './types.ts';

/** List all available authentication users */
export const listUsers = async () => {
  const adminClient = getServiceRoleClient();
  // NOTE - avoid `admin.listUsers` as returns all anonymous users
  // Cannot access `auth` schema so use created rpc function
  const { data, error } = await adminClient.rpc('get_non_anonymous_users');

  if (error) {
    console.error(error);
    return ErrorResponse(error.message);
  }

  return JSONResponse<IAdminListUsersResponse>(data || []);
};
