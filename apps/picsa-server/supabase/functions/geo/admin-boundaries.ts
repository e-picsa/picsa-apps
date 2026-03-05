import { corsHeaders } from '../_shared/cors.ts';
import osmtogeojson from 'osmtogeojson';
import mapshaper from 'mapshaper';
import { JSONResponse } from '../_shared/response.ts';

export const adminBoundaries = async (req: Request): Promise<Response> => {
  try {
    const { pathname } = new URL(req.url);
    const pathParts = pathname.split('/');
    const countryCode = pathParts[pathParts.length - 1];

    if (!countryCode || countryCode === 'country-boundaries') {
      return new Response(
        JSON.stringify({ error: 'countryCode is required as a positional parameter (e.g. /country-boundaries/zw)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Overpass query for admin level 4 boundaries matching ISO3166-2 prefix
    const overpassQuery = `
      [out:json][timeout:60];
      nwr["admin_level"="4"]["boundary"="administrative"]["ISO3166-2"~"^${countryCode.toUpperCase()}-"];
      out geom;
    `.trim();

    console.log(`Fetching Overpass data for ${countryCode}...`);

    // Fetch data from Overpass API
    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
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
    console.log(`Received ${osmData.elements?.length || 0} elements from Overpass for ${countryCode}`);

    // Convert OSM JSON to GeoJSON
    console.log('Converting to GeoJSON...');
    const geojson = osmtogeojson(osmData);

    console.log('Optimizing with Mapshaper...');
    let topojsonData: any = null;

    // Use mapshaper node interface with the generated geojson
    // Input geojson as an object literal in the dictionary
    const mapshaperInput = { 'input.geojson': geojson };

    // Commands explained:
    // -each: rebuilds properties keeping name and @id (matching OSM relation ID), avoiding missing field errors
    // -simplify: reduce complexity by 15% keeping general shapes
    // -o: export to TopoJSON format, quantizing coordinates to 1e4 for smaller file size without visually distorting standard zoom levels
    const mapshaperCommands = `-i input.geojson -each 'this.properties = { "@id": this.properties["@id"] || this.id || "", name: this.properties.name || "" }' -simplify dp 15% keep-shapes -o output.topojson format=topojson quantization=1e4 id-field=@id`;

    await new Promise((resolve, reject) => {
      mapshaper.applyCommands(mapshaperCommands, mapshaperInput, (err: Error, output: any) => {
        if (err) {
          reject(err);
        } else {
          try {
            const outputString = output['output.topojson'].toString();
            topojsonData = JSON.parse(outputString);
            resolve(true);
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });

    console.log('Mapshaper processing complete.');

    // Extract metadata from the TopoJSON objects
    let meta: any[] = [];
    if (topojsonData?.objects) {
      const firstObjectKey = Object.keys(topojsonData.objects)[0];
      const geometries = topojsonData.objects[firstObjectKey]?.geometries || [];
      meta = geometries.map((g: any) => ({
        id: g.id || g.properties?.['@id'] || '',
        name: g.properties?.name || '',
      }));
    }

    return JSONResponse({ topjson: topojsonData, meta });
  } catch (error) {
    console.error('Unexpected error in country-boundaries function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
