import { ensureDirSync, writeFileSync } from 'fs-extra';
import { resolve } from 'path';

/** Utility to ensure parent folder exists when writing to file */
export function ensureWrite(path: string, data: string) {
  ensureDirSync(resolve(path, '../'));
  writeFileSync(path, data);
}

/**
 * Take a nested json object and flatten so that all properties appear
 * within top-level keys.
 * Copied from https://stackoverflow.com/a/19101235
 * @example
 * ```
 * flattenJson({parent: {child: 'value'}})
 * // returns
 * {"parent.child":"value"}
 * ```
 */
export function flattenJSON(data: any) {
  var result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + '[' + i + ']');
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, '');
  return result;
}
