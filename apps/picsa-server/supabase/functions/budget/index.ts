import { corsHeaders } from '../_shared/cors.ts';
import { ErrorResponse } from '../_shared/response.ts';
import { importBudget } from './import.ts';
import { shareBudget } from './share.ts';
import { unshareBudget } from './unshare.ts';

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Try sending a POST request instead', { status: 400, headers: corsHeaders });
  }

  const { pathname } = new URL(req.url);
  const entryPoint = pathname.split('/')[2];

  switch (entryPoint) {
    case 'share':
      return shareBudget(req);
    case 'import':
      return importBudget(req);
    case 'unshare':
      return unshareBudget(req);
    default:
      return ErrorResponse(`Invalid endpoint: ${entryPoint}`, 501);
  }
});
