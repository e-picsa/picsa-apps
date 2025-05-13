import { decode } from 'djwt';
import { getServiceRoleClient } from './client.ts';
import type { Database } from '../../types/db.types.ts';

type IAppRole = Database['public']['Enums']['app_role'];

const mockAuthPayload = {
  aal: 'aal1',
  amr: [{ method: 'password', timestamp: 1746785674 }],
  app_metadata: { provider: 'email', providers: ['email'] },
  aud: 'authenticated',
  email: 'admin@picsa.app',
  exp: 1746790000,
  iat: 1746786400,
  is_anonymous: false,
  iss: 'http://127.0.0.1:54321/auth/v1',
  phone: '',
  picsa_roles: {} as Record<string, any>,
  role: 'authenticated',
  session_id: 'd05742c4-85b7-4b3d-bb2d-20185616d40a',
  sub: '00000000-0000-0000-0000-000000000000',
  user_metadata: {},
};

type SupabaseAuthJWT = typeof mockAuthPayload;

/** Return all auth roles stored for the current user making request */
async function getAuthRoles(req: Request) {
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');

  const [header, payload, signature] = decode(token);
  // NOTE - no need to verify jwt as already handled by supabase
  const { picsa_roles } = payload as SupabaseAuthJWT;
  return picsa_roles as { [deployment_id: string]: IAppRole[] };
}

/** Check whether the request user has specific user role on deployment */
export async function hasAuthRole(req: Request, deployment_id: string, role: IAppRole) {
  const userRoles = await getAuthRoles(req);
  const deploymentRoles = userRoles[deployment_id];
  const [featureName, featureRole] = role.split('.');
  // allow global role
  if (deploymentRoles.includes(featureRole as IAppRole)) return true;
  return deploymentRoles.includes(role);
}

/**
 * Query DB to check auth roles
 * This may be required if frontend token does not refresh with updated roled
 * (not currently required for dashboard, but may be useful in future)
 */
async function refreshRoles(token: string) {
  // Use admin client to retrieve list of user roles
  // NOTE - could also decode JWT but assumes up-to-date
  const adminClient = getServiceRoleClient();

  const { data: userData } = await adminClient.auth.getUser(token);
  const user = userData.user;
  if (user) {
    console.log('user', user);
  }

  // Query user roles from the database
  const { data, error } = await adminClient.from('user_roles').select('deployment_id, roles').eq('user_id', user?.id);
  // TODO - merge roles in same way as auth hook
}
