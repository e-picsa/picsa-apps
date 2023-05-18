// NOTE - previously used https://www.npmjs.com/package/xml-js
// however requires node polyfills and output formatting not ideal
import { X2jOptionsOptional, XMLBuilder, XMLParser } from 'fast-xml-parser';

/**
 * Convert xml to json
 * @param xml
 * @returns
 */
export function xmlToJson<T = Record<string, any>>(xmlString: string, options: X2jOptionsOptional = {}) {
  // parser configured to convert string/bool/number by default
  // https://naturalintelligence.github.io/fast-xml-parser/
  const parser = new XMLParser(options);
  return parser.parse(xmlString) as T;
}

/**
 *
 * @param json
 * @returns
 */
export function jsonToXML(json: Record<string, any>) {
  const builder = new XMLBuilder();
  return builder.build(json);
}

export function xmlStringToFile(xmlString: string) {
  // browser-based implementation
  if (typeof window !== 'undefined') {
    const blob = new Blob([xmlString]);
    if ('File' in window) {
      return new File([blob], 'submission.xml', { type: 'application/xml' });
    }
  }
  throw new Error('File api not supported in this environment');
}
