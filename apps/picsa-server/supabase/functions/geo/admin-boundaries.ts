import { corsHeaders } from '../_shared/cors.ts';
import osmtogeojson from 'osmtogeojson';
import mapshaper from 'mapshaper';
import { z } from 'zod';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import { getServiceRoleClient } from '../_shared/client.ts';
import { validateBody } from '../_shared/validation.ts';
import { fetchWithRetry } from '../_shared/fetch.ts';

/**
 * All overpass queries output with processing
 * ```ts
 * .rels;                 // Finds matching relations, stores in named set
 * .rels out body qt;     // Outputs relation metadata (tags, member list) — no geometry
 * way(r.rels);           // Selects only way members of those relations (excludes nodes)
 * out geom qt;           // Outputs way geometry with coordinates
 * ```
 */
const OVERPASS_OUTPUT = `
    out geom;
`.trim();

/**
 *
 * Level 2 corresponds to simple national border
 * Levels 3-5 are subnational boundaries and may or may not exist depending on country
 *
 * All subnational queries are optimised to search within bounds of country area
 */
const OVERPASS_QUERY_MAPPING: { [admin_level: number]: (countryCode: string) => string } = {
  // E.g. MW - National Boundary: https://www.openstreetmap.org/relation/195290
  2: (countryCode) => `
      [out:json][timeout:120];
      relation["ISO3166-1"="${countryCode}"]["boundary"="administrative"]["admin_level"="2"];
      ${OVERPASS_OUTPUT}
    `,
  // E.g. MW - Southern Region: https://www.openstreetmap.org/relation/3365670
  3: (countryCode) => `
      [out:json][timeout:120];
      area["ISO3166-1"="${countryCode}"]->.searchArea;
      relation["admin_level"="3"]["boundary"="administrative"]["ISO3166-2"~"^${countryCode}-"](area.searchArea);
      ${OVERPASS_OUTPUT}
    `,
  // E.g. MW - Mangochi District: https://www.openstreetmap.org/relation/7345875
  4: (countryCode) => `
      [out:json][timeout:120];
      area["ISO3166-1"="${countryCode}"]->.searchArea;
      relation["admin_level"="4"]["boundary"="administrative"]["ISO3166-2"~"^${countryCode}-"](area.searchArea);
      ${OVERPASS_OUTPUT}
    `,
  // NOTE - generation admin_level 5 does not include iso data, so just retrieve all level_5 within search area
  // E.g. ZM - Kabwe District: https://www.openstreetmap.org/relation/10676417
  5: (countryCode) => `
      [out:json][timeout:120];
      area["ISO3166-1"="${countryCode}"]->.searchArea;
      relation["admin_level"="5"]["boundary"="administrative"](area.searchArea);
      ${OVERPASS_OUTPUT}
    `,
};
const validAdminLevels = Object.keys(OVERPASS_QUERY_MAPPING).map(Number);

const boundaryRequestSchema = z.object({
  country_code: z
    .string()
    .length(2)
    .regex(/^[a-zA-Z]{2}$/, 'Must be a valid 2-letter country code')
    .transform((v) => v.toUpperCase()),
  admin_level: z.coerce
    .number()
    .int()
    .refine((val) => validAdminLevels.includes(val), {
      message: `Admin level must be one of: ${validAdminLevels.join(', ')}`,
    }),
});

export type AdminBoundariesSchema = z.infer<typeof boundaryRequestSchema>;

export const adminBoundaries = async (req: Request) => {
  try {
    const { admin_level, country_code } = await validateBody(req, boundaryRequestSchema);

    const overpassQuery = OVERPASS_QUERY_MAPPING[admin_level](country_code).trim();

    console.log(`Fetching Overpass data for ${country_code}...`);

    // Fetch data from Overpass API
    const overpassResponse = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
    });

    if (!overpassResponse.ok) {
      const errorText = await overpassResponse.text();
      console.error(`Overpass API error (${overpassResponse.status}):`, errorText);

      let status = 502; // Bad Gateway default
      let message = 'Failed to fetch from Overpass API';

      if (overpassResponse.status === 429) {
        status = 429;
        message = 'Overpass API rate limit exceeded. Please try again later.';
      } else if (overpassResponse.status === 504) {
        status = 504;
        message = 'Overpass API gateway timeout. The query took too long to execute.';
      }

      return new Response(
        JSON.stringify({
          error: message,
          details: errorText || overpassResponse.statusText,
          upstream_status: overpassResponse.status,
        }),
        {
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const osmData = await overpassResponse.json();
    console.log(`Received ${osmData.elements?.length || 0} elements from Overpass for ${country_code}`);

    // Convert OSM JSON to GeoJSON
    console.log('Converting to GeoJSON...');
    const geojson = osmtogeojson(osmData);

    console.log('Optimizing with Mapshaper...');
    let topojson: any = null;

    // Use mapshaper node interface with the generated geojson
    // Input geojson as an object literal in the dictionary
    const mapshaperInput = { 'input.geojson': geojson };

    const mapshaperCmds = [
      `-i input.geojson`,
      // Fixes OSM gaps/slivers and ensures valid manifold geometry
      `-clean`,
      // Visvalingam simplification at 10% (sufficient for Zoom 8 resolution ~600m/px)
      `-simplify weighting=0.5 10%`,
      // Remove noise/enclaves smaller than 10km2 to reduce payload
      `-filter-islands min-area=10km2`,
      // Drop unnecessary metadata; retain only core identifiers
      `-each 'this.properties = { id: this.properties["@id"] || this.id, name: this.properties.name || "" }'`,
      // Export as TopoJSON with 1e3 quantization for optimized coordinate storage
      `-o output.topojson format=topojson quantization=1e3`,
    ];

    await new Promise((resolve, reject) => {
      mapshaper.applyCommands(mapshaperCmds.join(' '), mapshaperInput, (err: Error, output: any) => {
        if (err) {
          reject(err);
        } else {
          try {
            const outputString = output['output.topojson'].toString();
            topojson = JSON.parse(outputString);
            resolve(true);
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });

    // Convert to string first
    const topojsonString = JSON.stringify(topojson);

    // Get actual bytes
    const bytes = new TextEncoder().encode(topojsonString).length;

    // Convert to nearest KB
    const size_kb = Math.round(bytes / 1024);

    console.log('Mapshaper processing complete.');

    // TODO - update DB to include
    // Mapshaper usually puts features under the name of the input file
    const feature_count = topojson.objects['input.geojson']?.geometries.length || 0;

    // TopoJSON often includes a top-level bbox if requested or generated
    const bbox = topojson.bbox || [];

    const supabase = getServiceRoleClient();
    const { error } = await supabase.schema('geo').from('boundaries').upsert(
      {
        country_code,
        admin_level,
        topojson,
        size_kb,
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
