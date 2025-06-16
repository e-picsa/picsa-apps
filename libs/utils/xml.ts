/**
 * NOTE - Utils duplicated from libs/webcomponents/src/components/enketo-webform
 * Should migrate with tests
 */

// NOTE - previously used https://www.npmjs.com/package/xml-js
// however requires node polyfills and output formatting not ideal
import { X2jOptions, XMLBuilder, XMLParser } from 'fast-xml-parser';

/**
 * Convert xml to json
 * @param xml
 * @returns
 */
export function xmlToJson<T = Record<string, any>>(xmlString: string, options: X2jOptions = {}) {
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

/**
 * Replace content of a given xml tag (first instance only)
 * TODO - add tests
 *
 * @param xml string representation of xml
 * @param tagname node selector to query within xml
 * @param content content to replace
 *
 * @example
 * ```
 * xmlNodeReplaceContent({
 * xml: '<model><instance><old_data>...<old_data></instance></model>'
 * tagName: "instance",
 * content: "<new_data>...</new_data>"
 * })
 * // Returns
 * // "<model><instance><new_data>...<new_data></instance></model>"
 * ```
 * https://www.w3schools.com/xml/dom_nodes_replace.asp
 */
export function xmlNodeReplaceContent(options: { xml: string; tagname: string; content: string }) {
  const { xml, tagname, content } = options;
  const xmlDoc = parseXmlString(xml);
  const targetEl = xmlDoc.getElementsByTagName(tagname)[0];
  targetEl.innerHTML = content;
  const replacedXmlString = xmlDoc.firstElementChild!.outerHTML.toString();
  return replacedXmlString;
}

/** Convert an xml string to an xml document */
function parseXmlString(xmlString: string) {
  return new DOMParser().parseFromString(xmlString, 'application/xml');
}
