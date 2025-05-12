import { ErrorResponse } from '../../_shared/response.ts';
import { getAuthRoles } from '../../_shared/auth.ts';
import { listUsers } from './list-users.ts';
import { listUserRoles } from './list-user-roles.ts';
import type { Database } from '../../../types/db.types.ts';

type IAppRole = Database['public']['Enums']['app_role'];
/**
 * Handle admin operations. These are posted to endpoints with deployment prefix
 * `/dashboard/admin/{deployment_id}/{endpoint}`
 */
export const admin = async (req: Request) => {
  const { pathname } = new URL(req.url);
  const [deploymentId, adminEndpoint] = pathname.replace('/dashboard/admin/', '').split('/');

  const roles = await getAuthRoles(req);
  const deploymentRoles = roles[deploymentId];

  console.log('User Roles: ', deploymentId, deploymentRoles);

  console.log('process admin request', deploymentId, adminEndpoint);

  switch (adminEndpoint) {
    case 'list-users': {
      const roleRequired: IAppRole = 'deployments.admin';
      if (!deploymentRoles.includes(roleRequired)) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      return listUsers();
    }
    case 'list-user-roles': {
      return listUserRoles(deploymentId);
    }

    default:
      return ErrorResponse(`Invalid endpoint: ${adminEndpoint}`, 501);
  }
};
