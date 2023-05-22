import fs from 'fs-extra';
import path from 'path';

/**
 * find files by a given extension recursively, returning full paths
 * @param ext - file extension (without '.'), e.g. 'xlsx' or 'json' (leave blank for all files)
 */
export function recursiveFindByExtension(base: string, ext?: string, files?: string[], result?: string[]) {
  files = files || fs.readdirSync(base);
  result = result || [];
  for (const file of files) {
    const newbase = path.join(base, file);
    if (fs.statSync(newbase).isDirectory()) {
      const newFiles = fs.readdirSync(newbase);
      result = recursiveFindByExtension(newbase, ext, newFiles, result);
    } else {
      if (ext) {
        if (file.split('.').pop() === ext) {
          result.push(newbase);
        }
      } else {
        result.push(newbase);
      }
    }
  }
  return result;
}
