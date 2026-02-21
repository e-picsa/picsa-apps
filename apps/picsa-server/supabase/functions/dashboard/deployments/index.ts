import { ErrorResponse } from '../../_shared/response.ts';
import { notifyRequests } from './notify-requests.ts';

export const deployments = async (req: Request) => {
  const { pathname } = new URL(req.url);
  // e.g. /dashboard/deployments/notify-requests
  const endpoint = pathname.replace('/dashboard/deployments/', '').split('/')[0];

  switch (endpoint) {
    case 'notify-requests':
      return notifyRequests(req);
    default:
      return ErrorResponse(`Invalid deployments endpoint: ${endpoint}`, 501);
  }
};
