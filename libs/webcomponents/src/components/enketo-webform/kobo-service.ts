import { Builder as XMLBuilder, parseString as parseXMLString } from 'xml2js';

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

  private client;

  constructor() {
    //
  }

  /**
   * Convert xml to json
   * NOTE - unless configured carefully the output json may contain unexpected structures
   * See https://www.npmjs.com/package/xml2js
   * @param xml
   * @returns
   */
  public static async xmlToJson<T = Record<string, any>>(xml: string): Promise<T> {
    return new Promise((resolve, reject) =>
      parseXMLString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as T);
        }
      })
    );
  }

  /**
   *
   * @param json
   * @returns
   */
  public static jsonToXML(json: Record<string, any>) {
    const builder = new XMLBuilder();
    return builder.buildObject(json);
  }

  /**
   *
   * @param xmlSubmission
   * https://docs.getodk.org/openrosa-form-submission/
   * https://bitbucket.org/javarosa/javarosa/wiki/FormSubmissionAPI
   */
  public submitXMLSubmission(xmlSubmission: string) {
    const { v1 } = this.apiEndpoints;
    const endpoint = `${v1}/submissions`;
    console.log('submit xml submission', { xmlSubmission, endpoint });
    //
  }

  public updateJSONSubmission(data: Record<string, any>, id: string) {
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

  /** Add xml header prior to upload */
  private formatXML(xmlString: string) {
    return `<?xml version="1.0" encoding="utf-8"?>\n${xmlString}`;
  }
}
