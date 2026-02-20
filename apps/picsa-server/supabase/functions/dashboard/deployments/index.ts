import { ErrorResponse } from '../../_shared/response.ts';
import { requestAccess } from './request-access.ts';

export const deployments = async (req: Request) => {
  const { pathname } = new URL(req.url);
  // e.g. /dashboard/deployments/request-access
  const endpoint = pathname.replace('/dashboard/deployments/', '').split('/')[0];

  switch (endpoint) {
    case 'request-access':
      return requestAccess(req);
    default:
      return ErrorResponse(`Invalid deployments endpoint: ${endpoint}`, 501);
  }
};
