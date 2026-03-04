import { corsHeaders } from '../_shared/cors.ts';
import { countryBoundaries } from './country-boundaries.ts';

export const climate = (req: Request) => {
  const { pathname } = new URL(req.url);
  // e.g. /dashboard/climate/country-boundaries
  // Or if it's called directly /climate/country-boundaries
  // Let's match the last part of the path
  const pathParts = pathname.split('/');
  const entryPoint = pathParts[pathParts.length - 1];
  switch (entryPoint) {
    case 'country-boundaries':
      return countryBoundaries(req);

    default:
      return new Response(`Invalid climate endpoint: ${entryPoint}`, {
        status: 501,
        headers: corsHeaders,
      });
  }
};
