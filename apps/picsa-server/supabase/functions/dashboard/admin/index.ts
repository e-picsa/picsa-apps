import { ErrorResponse } from '../../_shared/response.ts';
import { hasAuthRole } from '../../_shared/auth.ts';
import { listUsers } from './list-users.ts';
import { listUserRoles } from './list-user-roles.ts';
import { addUser } from './add-user.ts';
import { removeUser } from './remove-user.ts';
import { updateUserRoles } from './update-user-roles.ts';
import { AppRole } from '../../../types/index.ts';

/**
 * Handle admin operations. These are posted to endpoints with deployment prefix
 * `/dashboard/admin/{deployment_id}/{endpoint}`
 */
export const admin = async (req: Request) => {
  const { pathname } = new URL(req.url);
  const [deploymentId, adminEndpoint] = pathname.replace('/dashboard/admin/', '').split('/');

  switch (adminEndpoint) {
    case 'list-users': {
      const roleRequired: AppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      return listUsers();
    }
    case 'add-user': {
      const roleRequired: AppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      const payload = await req.json();
      payload.deployment_id = deploymentId;
      return addUser(req, payload);
    }
    case 'remove-user': {
      const roleRequired: AppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to list users`, 401);
      }
      const payload = await req.json();
      payload.deployment_id = deploymentId;
      return removeUser(payload);
    }

    case 'list-user-roles': {
      return listUserRoles(deploymentId);
    }

    case 'update-user-roles': {
      const roleRequired: AppRole = 'deployments.admin';
      const hasPermission = await hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to update user roles`, 401);
      }
      const payload = await req.json();
      payload.deployment_id = deploymentId;
      return updateUserRoles(req, payload);
    }

    default:
      return ErrorResponse(`Invalid admin endpoint: ${adminEndpoint}`, 501);
  }
};
