import { Sha256 } from 'https://deno.land/std@0.119.0/hash/sha256.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Database } from '../../types/index.ts';

/** Additional fields populated during db save */
type IDBRow = Database['public']['Tables']['monitoring_tool_submissions']['Row'];

type IDBInsert = Database['public']['Tables']['monitoring_tool_submissions']['Insert'];

/**
 * Accepts request with formdata xml
 * Submits to kobotoolbox and writes to table
 *
 */

/**
 * xml md5 hash is used to detect duplicate responses (similar to kobo method)
 * this is validated on the db as requiring unique values
 * https://github.com/kobotoolbox/kobocat/blob/main/onadata/libs/utils/logger_tools.py#L177-L178
 * https://github.com/kobotoolbox/kobocat/blob/main/onadata/apps/logger/models/instance.py#L461
 */
function generateXmlHash(xml: string) {
  const md5 = new Sha256();
  return md5.update(xml).hex();
}

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
