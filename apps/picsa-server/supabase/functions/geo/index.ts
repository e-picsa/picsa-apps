import { AppRole } from '../../types/index.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getRequestDeploymentId, hasAuthRole } from '../_shared/auth.ts';
import { adminBoundaries } from './admin-boundaries.ts';
import { ErrorResponse } from '../_shared/response.ts';

Deno.serve(async (req: Request) => {
  // handle cors pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Try sending a POST or GET request instead', { status: 400 });
  }

  const { pathname } = new URL(req.url);
  // e.g. /geo/admin-boundaries
  const pathParts = pathname.split('/');
  const entryPoint = pathParts[2];

  const deploymentId = getRequestDeploymentId(req);
  if (!deploymentId) {
    return ErrorResponse(`[Headers] x-picsa-deployment-id required`);
  }

  switch (entryPoint) {
    case 'admin-boundaries':
      if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      }
      const roleRequired: AppRole = 'app.admin';
      const hasPermission = hasAuthRole(req, deploymentId, roleRequired);
      if (!hasPermission) {
        return ErrorResponse(`[${roleRequired}] permission required to retrieve geo boundaries`, 401);
      }
      return adminBoundaries(req);

    default:
      return new Response(`Invalid endpoint: ${entryPoint}`, {
        status: 501,
        headers: corsHeaders, // Keep CORS headers even on error
      });
  }
});
