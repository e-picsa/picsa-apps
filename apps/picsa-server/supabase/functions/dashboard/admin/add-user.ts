import { Database } from '../../../types/db.types.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';

/** List all available authentication users */
export const addUser = async (params: { user_id: string; deployment_id: string }) => {
  const adminClient = getServiceRoleClient();

  const { user_id, deployment_id } = params;

  const entry: Database['public']['Tables']['user_roles']['Insert'] = { deployment_id, roles: ['viewer'], user_id };
  const { data, error } = await adminClient.from('user_roles').insert(entry).select('*');
  if (error) {
    return ErrorResponse(error);
  }
  return JSONResponse<any>({ data });
};
