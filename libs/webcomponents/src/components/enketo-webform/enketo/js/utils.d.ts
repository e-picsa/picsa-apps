/**
 * Parses an Expression to extract all function calls and their argument arrays.
 *
 * @static
 * @param {string} expr - The expression to search
 * @param {string} func - The function name to search for
 * @return {Array<Array<string, any>>} The result array, where each result is an array containing the function call and array of arguments.
 */
export function parseFunctionFromExpression(expr: string, func: string): Array<Array<string, any>>;
/**
 * @static
 * @param {string} str - original string
 * @return {string} stripped string
 */
export function stripQuotes(str: string): string;
/**
 * @static
 * @param {object} file - File instance
 * @param {string} postfix - postfix for filename
 * @return {string} new filename
 */
export function getFilename(file: object, postfix: string): string;
/**
 * @static
 * @param {*} n - value
 * @return {boolean} whether it is a number value
 */
export function isNumber(n: any): boolean;
/**
 * @static
 * @param {string} name - a cookie to look for
 * @return {string|undefined} the value of the cookie
 */
export function readCookie(name: string): string | undefined;
/**
 * @static
 * @param {string} dataURI - dataURI
 * @return {Blob} dataURI converted to a Blob
 */
export function dataUriToBlobSync(dataURI: string): Blob;
/**
 * @static
 * @param {Event} event - a paste event
 * @return {string|null} clipboard data text value contained in event or null
 */
export function getPasteData(event: Event): string | null;
/**
 * @static
 * @param {File} file - Image file to be resized
 * @param {number} maxPixels - Maximum pixels of resized image
 * @return {Promise<Blob>} Promise of resized image blob
 */
export function resizeImage(file: File, maxPixels: number): Promise<Blob>;
/**
 * Copied from: https://gist.github.com/creationix/7435851
 * Joins path segments.  Preserves initial "/" and resolves ".." and "."
 * Does not support using ".." to go above/outside the root.
 * This means that join("foo", "../../bar") will not resolve to "../bar"
 */
export function joinPath(...args: any[]): string;
export function getScript(url: any): void;
export function encodeHtmlEntities(text: any): any;
