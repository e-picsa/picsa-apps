import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';
import { parse } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { Sha256 } from 'https://deno.land/std@0.119.0/hash/sha256.ts';
import { getClient, SupabaseClient } from '../_shared/client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { Database } from '../../../../types/supabase.ts';

interface IFormData {
  xml: string;
}

/** Additional fields populated during db save */
type IDBRow = Database['public']['Tables']['monitoring_tool_submissions']['Row'];

type IDBInsert = Database['public']['Tables']['monitoring_tool_submissions']['Insert'];

let client: SupabaseClient<Database>;

/**
 * Accepts request with formdata xml
 * Submits to kobotoolbox and writes to table
 *
 * TODO - test file attachments
 * TODO - add tests
 */
serve(async (req) => {
  // validate form_data - advanced validation possible with packages such as 'oak'
  const hasFormData =
    req.headers.has('content-type') && req.headers.get('content-type')?.startsWith('multipart/form-data');
  if (!hasFormData) {
    return ErrorResponse('Formdata expected but not found');
  }
  const form = await multiParser(req);
  const { xml } = form?.fields as unknown as IFormData;
  if (!xml) {
    return ErrorResponse('XML not included with form');
  }

  // check connection to DB
  try {
    client = getClient(req);
  } catch (error) {
    console.error(error);
    return ErrorResponse(error.message);
  }

  // extract metadata and submit to db
  const entry: IDBInsert = {
    ...extractSubmissionMeta(xml),
    xml_hash: generateXmlHash(xml),
    xml,
  };

  const { data, error } = await submitDB(entry);
  if (error) {
    return ErrorResponse(error.message);
  }
  const dbEntry = data[0] as IDBRow;

  // submit to kobotoolbox and update db
  const res = await submitKoboXml(xml);
  dbEntry.kobo_response = await extractKoboResponse(res);
  const updatedEntry = await updateDB(dbEntry);

  return new Response(JSON.stringify(updatedEntry), { status: res.status });
});

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

/** Convert xml file submission to json and use to extract form_id and data */
function extractSubmissionMeta(xmlString: string) {
  // json format `{xml:{...},formABC:{...}}
  const { xml, ...submissions } = parse(xmlString);
  const [form_id, json] = Object.entries<Record<string, any>>(submissions as any)[0];
  for (const key of Object.keys(json)) {
    // remove xml meta
    if (key.startsWith('@')) {
      delete json[key];
    }
  }
  return { form_id, json };
}

async function extractKoboResponse(res: Response): Promise<string> {
  const xmlString = await res.text();
  const { xml, ...rest } = parse(xmlString);
  const json = rest as any;
  const OpenRosaResponse = json['OpenRosaResponse'] as { message?: string | { ['#text']: string } };
  if (OpenRosaResponse) {
    const { message } = OpenRosaResponse;
    if (typeof message === 'string') return message;
    if (message && message.constructor === {}.constructor && message['#text']) return message['#text'];
  }
  return xmlString;
}

function submitDB(entry: IDBInsert) {
  // chain select to also return row
  return client.from('monitoring_tool_submissions').insert(entry).select();
}
function updateDB(entry: IDBRow) {
  return client.from('monitoring_tool_submissions').upsert(entry).select();
}

/**
 * Post xml submission to kobotoolbox
 * Includes authorization token from environment
 */
async function submitKoboXml(xml: string) {
  const token = Deno.env.get('KOBO_API_KEY');
  if (!token) {
    return ErrorResponse('KOBO_API_KEY not provided. Please include in .env');
  }
  const headers = { 'X-OpenRosa-Version': '1.0', authorization: 'Token ' + token };
  const blob = new Blob([xml], { type: 'application/xml' });
  const body = new FormData();
  body.set('xml_submission_file', blob);
  return await fetch('https://kc.kobotoolbox.org/api/v1/submissions', { headers, method: 'POST', body });
}

function ErrorResponse(msg: string, status = 400) {
  return new Response(JSON.stringify({ msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
