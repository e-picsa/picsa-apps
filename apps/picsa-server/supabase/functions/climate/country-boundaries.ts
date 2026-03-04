import { corsHeaders } from '../_shared/cors.ts';
import osmtogeojson from 'osmtogeojson';
import mapshaper from 'mapshaper';

export const countryBoundaries = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const countryCode = body.countryCode;
    if (!countryCode) {
      return new Response(JSON.stringify({ error: 'countryCode is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      console.error('Overpass API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch from Overpass API' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const osmData = await overpassResponse.json();
    console.log(`Received ${osmData.elements?.length || 0} elements from Overpass for ${countryCode}`);

    // Convert OSM JSON to GeoJSON
    console.log('Converting to GeoJSON...');
    const geojson = osmtogeojson(osmData);

    console.log('Optimizing with Mapshaper...');
    let topojsonData = null;

    // Use mapshaper node interface with the generated geojson
    // Input geojson as an object literal in the dictionary
    const mapshaperInput = { 'input.geojson': geojson };

    // Commands explained:
    // -each: rebuilds properties keeping only name, avoiding the missing field error of -filter-fields
    // -lines: turn polygons into boundaries (lines) and remove duplicate shared edges
    // -simplify: reduce complexity by 15% keeping general shapes
    // -o: export to TopoJSON format, quantizing coordinates to 1e4 for smaller file size without visually distorting standard zoom levels
    const mapshaperCommands = `-i input.geojson -each 'this.properties = { name: this.properties.name || "" }' -lines -simplify dp 15% keep-shapes -o output.topojson format=topojson quantization=1e4`;

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

    return new Response(JSON.stringify(topojsonData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error in country-boundaries function:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
