// HACK - when running in node env FormData does not have in-built class (unlike browsers)
// https://masteringjs.io/tutorials/axios/axios-multi-form-data
import FormDataNode from 'form-data';

import { xmlStringToFile, xmlToJson } from './utils/utils';

/**
 * Service to handle submission to koboCollect via api
 *
 * https://github.dev/enketo/enketo-express
 *
 * NOTE - ideally this should be run as part of server-side rest client
 * to avoid exposing authToken and handle CORS
 */
export class KoboService {
  /**
   * Kobo uses separate apis depending on operation
   * URLs for specific apis
   * @param v1 kobocat (https://github.dev/kobotoolbox/kobocat)
   * @param v2 kpi (https://github.dev/kobotoolbox/kpi)
   */
  public apiEndpoints = {
    v1: 'https://kc.kobotoolbox.org/api/v1',
    v2: 'https://kf.kobotoolbox.org/api/v2',
  };

  /**
   * http client (default fetch)
   * should minimally implement post request handler and response status/text extract
   * */
  public httpHandlers = {
    req: (endpoint: string, options: RequestInit) =>
      fetch(endpoint, options).then(async (res) => {
        const status = res.status;
        const text = await res.text();
        return { status, text };
      }),
  };

  constructor(private config: { authToken: string }) {
    //
  }

  /**
   *
   * @param xmlSubmission
   * https://docs.getodk.org/openrosa-form-submission/
   * https://bitbucket.org/javarosa/javarosa/wiki/FormSubmissionAPI
   */
  public async submitXMLSubmission(xmlSubmission: string) {
    const formattedXML = this.formatXML(xmlSubmission);
    const { v1 } = this.apiEndpoints;
    const endpoint = `${v1}/submissions`;

    // convert xml string to a file and send as part of formatted POST request
    // as per https://docs.getodk.org/openrosa-form-submission/
    // const xml_submission_file = new Blob([formattedXML], { type: 'text/xml' });
    const xml_submission_file = xmlStringToFile(formattedXML);
    let headers = {
      Authorization: `Token ${this.config.authToken}`,
      'X-OpenRosa-Version': '1.0',
    };
    let body: any;

    // Handle formdata differently depending on browser or node environemnt
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      const formData = new FormData();
      formData.append('xml_submission_file', xml_submission_file);
      body = formData;
    } else {
      const formData = new FormDataNode();
      // calculate formdata boundary (done automatically in browser)
      headers = { ...headers, ...formData.getHeaders() };
      body = formData as any;
    }
    const { status, text } = await this.httpHandlers.req(endpoint, { method: 'POST', headers, body });
    return this.formatResponse(status, text);
  }

  private async formatResponse(status: number, text: string) {
    let data: unknown = text;

    // 201 status code accepted, 202 duplicate (already accepted)
    if (status === 200 || status === 202) {
      const responseJson = xmlToJson(this.formatXML(text), { ignoreAttributes: false });
      data = responseJson['OpenRosaResponse'];
      // reformat duplicate response message which has nested attributes for message
      if (data['message'].constructor === {}.constructor && '#text' in data['message']) {
        data['message'] = data['message']['#text'];
      }
    }
    return { status, data };
  }

  public wipUpdateJSONSubmission(data: Record<string, any>, id: string) {
    if (!id) {
      // Although we can still update data without an id (requires `confirm:true` payload),
      // This will update all records so want to avoid
      throw new Error('ID required for update');
    }
    const payload = {
      // Need to double stringify to include escape characters
      data: JSON.stringify(JSON.stringify(data)),
      submission_ids: [id],
    };
  }

  /** Ensure xml has proper headers (often omitted) */
  private formatXML(xmlString: string) {
    xmlString = xmlString.trim();
    if (!xmlString.startsWith('<?xml')) xmlString = `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`;
    return xmlString;
  }
}
