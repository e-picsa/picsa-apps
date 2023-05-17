import { xmlToJson } from './utils/utils';

/**
 * Service to handle submission to koboCollect via api
 *
 *
 *
 * https://github.dev/enketo/enketo-express
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
    const formData = new FormData();
    // convert xml string to a file and send as part of formatted POST request
    const xml_submission_file = new Blob([formattedXML], { type: 'application/xml' });
    formData.append('xml_submission_file', xml_submission_file);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authentication: `Token ${this.config.authToken}`,
        'Content-Type': 'multipart/form-data',
        'X-OpenRosa-Version': '1.0',
      },
      body: formData,
    });
    return this.getFormattedResponseData(res);
  }

  private async getFormattedResponseData(res: Response) {
    const responseText = await res.text();
    let data: unknown = responseText;
    const status = res.status;
    // 201 status code accepted, 202 duplicate (already accepted)
    if (status === 200 || status === 202) {
      const responseJson = await xmlToJson(this.formatXML(responseText));
      const { $, ...rest } = responseJson['OpenRosaResponse'];
      data = rest;
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
