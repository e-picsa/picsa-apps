import { ErrorResponse } from '../../_shared/response.ts';
import { hasAuthRole } from '../../_shared/auth.ts';
import { listUsers } from './list-users.ts';
import { listUserRoles } from './list-user-roles.ts';
import type { Database } from '../../../types/db.types.ts';
import { addUser } from './add-user.ts';

type IAppRole = Database['public']['Enums']['app_role'];
/**
 * Handle admin operations. These are posted to endpoints with deployment prefix
 * `/dashboard/admin/{deployment_id}/{endpoint}`
 */
export const admin = async (req: Request) => {
  const { pathname } = new URL(req.url);
  const [deploymentId, adminEndpoint] = pathname.replace('/dashboard/admin/', '').split('/');

  switch (adminEndpoint) {
    case 'list-users': {
      const roleRequired: IAppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      return listUsers();
    }
    case 'add-user': {
      const roleRequired: IAppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      const payload = await req.json();
      return addUser(payload);
    }

    case 'list-user-roles': {
      return listUserRoles(deploymentId);
    }

    default:
      return ErrorResponse(`Invalid endpoint: ${adminEndpoint}`, 501);
  }
};
