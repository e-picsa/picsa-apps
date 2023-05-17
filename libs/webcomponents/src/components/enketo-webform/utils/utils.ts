import { Builder as XMLBuilder, parseString as parseXMLString } from 'xml2js';

/**
 * Convert xml to json
 * NOTE - unless configured carefully the output json may contain unexpected structures
 * See https://www.npmjs.com/package/xml2js
 * @param xml
 * @returns
 */
export async function xmlToJson<T = Record<string, any>>(xml: string): Promise<T> {
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
export function jsonToXML(json: Record<string, any>) {
  const builder = new XMLBuilder();
  return builder.buildObject(json);
}
