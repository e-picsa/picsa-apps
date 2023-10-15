import { parse } from 'https://deno.land/x/xml@2.1.1/mod.ts';
import { ErrorResponse } from '../_shared/response.ts';

/** JSON representation of enketo xml data for submission */
interface IParsedSubmissionXML {
  /** Legacy uuid populated by enketo (but not used on kobo) */
  formhub: { uuid: string };
  /** ISO String timestamp, e.g. '2023-10-12T13:47:35.485-07:00' */
  start: string;
  /** ISO String timestamp, e.g. '2023-10-12T13:47:35.485-07:00' */
  end: string;
  /** Form version, e.g. 'vJ8FXDvzh4rCWFBUbjfnPs' */
  __version__: string;
  meta: {
    /** Instance id prefixed with uuid, e.g. `uuid:3ccd2aa1-ced8-49ad-8c61-b0e38cb827e5` */
    instanceID: string;
  };
  /** All inputs are stored at top-level key-value pairs */
  [input_field: string]: any;
}

/** JSON representation of data as processed on kobo server */
interface IKoboSubmission {
  /** Unique id as populated by kobo - used for data lookup/delete operations */
  _id: number;
  'formhub/uuid': string;
  start: string;
  end: string;
  __version__: 'vJ8FXDvzh4rCWFBUbjfnPs';
  'meta/instanceID': 'uuid:47cbf2fc-f554-47ae-8cfa-a8bb7480d893';
  /** form id */
  _xform_id_string: 'aLgKwDoHNd38sZyBQMV293';
  /** Extracted/duplicate version of meta/instanceID (without uuid: prefix) */
  _uuid: '47cbf2fc-f554-47ae-8cfa-a8bb7480d893';
  _attachments: [];
  _status: 'submitted_via_web';
  _geolocation: [null, null];
  _submission_time: string;
  _tags: [];
  _notes: [];
  _validation_status: Record<string, unknown>;
  _submitted_by: string;
  /** All inputs are stored at top-level key-value pairs */
  [input_field: string]: any;
}

/** Base request method to kobo toolbox. Include token authorization headers */
async function KoboRequest(endpoint: string, requestOptions: RequestInit) {
  const token = Deno.env.get('KOBO_API_KEY');
  if (!token) {
    return ErrorResponse('KOBO_API_KEY not provided. Please include in .env');
  }
  const headers = { 'X-OpenRosa-Version': '1.0', authorization: 'Token ' + token };
  const options: RequestInit = { headers, ...requestOptions };
  return await fetch(endpoint, options);
}

/**
 * Post xml submission to kobotoolbox
 * Includes authorization token from environment
 * @returns
 * 201 status code created
 * 202 status code duplicate
 */
export async function createKoboSubmission(xml: string) {
  const blob = new Blob([xml], { type: 'application/xml' });
  const body = new FormData();
  body.set('xml_submission_file', blob);
  return await KoboRequest('https://kc.kobotoolbox.org/api/v1/submissions', { method: 'POST', body });
}

/**
 * Insert or update a kobo submission from XML
 * Form and submission instance id will be extracted from xml. As kobo provides no native update functionality
 * in case where submission already exists it will be deleted and new submission populated
 */
export async function upsertKoboSubmission(xml: string) {
  const { formId, json } = extractSubmissionXML(xml);
  const uuid = json.meta.instanceID.replace('uuid:', '');
  const existingSubmission = await getKoboSubmission(formId, uuid);
  if (existingSubmission) {
    const { _id } = existingSubmission;
    await deleteKoboSubmission(formId, _id);
  }
  return await createKoboSubmission(xml);
}

/** Retrieve kobo submission data for a given form and instance uuid (string) or kobo id (number)*/
export async function getKoboSubmission(formId: string, uuid: string | number) {
  const getRes = await KoboRequest(`https://kf.kobotoolbox.org/api/v2/assets/${formId}/data/${uuid}?format=json`, {
    method: 'GET',
  });
  if (getRes.status === 200) {
    const submission = await getRes.json();
    return submission as IKoboSubmission;
  }
  if (getRes.status === 404) {
    // Still process body when no entry exists to prevent Deno test error
    const body = await getRes.text();
    return null;
  }
  const parsed = extractKoboResponse(getRes);
  throw new Error('Get Kobo Submission Error\n' + JSON.stringify(parsed));
}

/**
 * Delete a kobo submission identified by formId and form instance uuid
 * Will perform lookup by uuid to extract kobo id required for delete operation
 */
export async function deleteKoboSubmissionByUUID(formId: string, uuid: string) {
  const getRes = await KoboRequest(`https://kf.kobotoolbox.org/api/v2/assets/${formId}/data/${uuid}?format=json`, {
    method: 'GET',
  });
  if (getRes.status === 200) {
    const { _id } = await getRes.json();
    return deleteKoboSubmission(formId, _id);
  } else {
    return getRes;
  }
}
/** Delete a kobo submission identified by formId and numeric kobo _id */
async function deleteKoboSubmission(formId: string, _id: number) {
  return await KoboRequest(`https://kf.kobotoolbox.org/api/v2/assets/${formId}/data/${_id}?format=json`, {
    method: 'DELETE',
  });
}

/** Convert xml file submission to json and use to extract formId and data */
export function extractSubmissionXML(xmlString: string) {
  // json format `{xml:{...},formABC:{...}}
  const { xml, ...submissions } = parse(xmlString);
  const [formId, json] = Object.entries<IParsedSubmissionXML>(submissions as any)[0];
  for (const key of Object.keys(json)) {
    // remove xml meta
    if (key.startsWith('@')) {
      delete (json as any)[key];
    }
  }
  return { formId, json };
}

/**
 * When Kobo returns response code it usually includes xml body
 * Return xml in raw format and as parsed json
 */
export async function extractKoboResponse(res: Response) {
  let text: string | null = null;
  let json: any | null = null;

  if (res.body) {
    const contentType = res.headers.get('content-type');
    switch (contentType) {
      case 'application/json':
        json = await res.json();
        break;
      case 'text/xml; charset=utf-8': {
        text = await res.text();
        json = parse(text);
        break;
      }
      default:
        console.warn('Could not parse kobo response', contentType);
        text = await res.text();
        break;
    }
  }
  return { json, text };
}
