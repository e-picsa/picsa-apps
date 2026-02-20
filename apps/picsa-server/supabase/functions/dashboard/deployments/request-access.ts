import { ErrorResponse, JSONResponse } from '../../_shared/response.ts';
import { getClient } from '../../_shared/client.ts';

export const requestAccess = async (req: Request) => {
  const supabase = getClient(req);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return ErrorResponse('Unauthorized', 401);
  }

  const payload = await req.json();
  const { deployment_id } = payload;

  if (!deployment_id) {
    return ErrorResponse('deployment_id is required', 400);
  }

  const { data, error } = await supabase
    .from('deployment_access_requests')
    .insert({ user_id: user.id, deployment_id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return ErrorResponse('Access request already exists', 409);
    }
    console.error('Failed to create access request:', error);
    return ErrorResponse('Internal Server Error', 500);
  }

  return JSONResponse(data);
};
