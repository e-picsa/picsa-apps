import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { IAdminListUsersResponse } from './types.ts';

/** List all available authentication users */
export const listUsers = async () => {
  const adminClient = getServiceRoleClient();
  // TODO - pagination
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 500 });
  if (error) {
    console.error(error);
    return ErrorResponse(error.message);
  }

  return JSONResponse<IAdminListUsersResponse>(
    data.users.map((user) => {
      const { email, email_confirmed_at, last_sign_in_at, id } = user;
      return { email, email_confirmed_at, id, last_sign_in_at };
    })
  );
};
