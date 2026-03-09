import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'zod';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { getServiceRoleClient } from '../_shared/client.ts';
import { validateBody } from '../_shared/validation.ts';
import { fetchWithRetry } from '../_shared/fetch.ts';

/**
 * Code to generate topojson is deployed to Google Cloud Run (better memory management),
 * deployed from https://github.com/e-picsa/geo-boundaries-topojson
 */
const GEO_BOUNDARY_API_URL = Deno.env.get('GEO_BOUNDARY_API_URL') || 'https://geo-boundaries.picsa.app';

const boundaryRequestSchema = z.object({
  country_code: z
    .string()
    .length(2)
    .regex(/^[a-zA-Z]{2}$/, 'Must be a valid 2-letter country code')
    .transform((v) => v.toUpperCase()),
  admin_level: z.coerce.number().int().min(2).max(5),
});

export type AdminBoundariesSchema = z.infer<typeof boundaryRequestSchema>;

export const adminBoundaries = async (req: Request) => {
  try {
    const { admin_level, country_code } = await validateBody(req, boundaryRequestSchema);

    console.log(`Fetching data for ${country_code}...`);

    // Fetch data from API
    const apiResponse = await fetchWithRetry(GEO_BOUNDARY_API_URL, {
      method: 'POST',
      body: JSON.stringify({ admin_level, country_code }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`API error (${apiResponse.status}):`, errorText);

      let status = 502; // Bad Gateway default
      let message = 'Failed to fetch from API';

      if (apiResponse.status === 429) {
        status = 429;
        message = 'API rate limit exceeded. Please try again later.';
      } else if (apiResponse.status === 504) {
        status = 504;
        message = 'API gateway timeout. The query took too long to execute.';
      }

      return new Response(
        JSON.stringify({
          error: message,
          details: errorText || apiResponse.statusText,
          upstream_status: apiResponse.status,
        }),
        {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const data = await apiResponse.json();
    const { size_kb, feature_count, bbox, topojson } = data;

    const supabase = getServiceRoleClient();
    const { error } = await supabase.schema('geo').from('boundaries').upsert(
      {
        country_code,
        admin_level,
        size_kb,
        feature_count,
        bbox,
        topojson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'country_code,admin_level' },
    );

    if (error) {
      return ErrorResponse(`DB upsert fail: ${error.message}`);
    }

    return JSONResponse(
      {
        message: 'Boundary data stored successfully',
        country_code,
        admin_level,
        feature_count,
        bbox,
        size_kb,
      },
      201,
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error(typeof error, error);
    const e = error as any;
    const msg = typeof e === 'string' ? e : e?.details || e?.error || e.message || e.msg || e;
    return ErrorResponse(msg);
  }
};
