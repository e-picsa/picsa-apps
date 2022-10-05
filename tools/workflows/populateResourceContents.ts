import { createHash } from 'crypto';
import {
  statSync,
  readdirSync,
  writeFileSync,
  existsSync,
  readJsonSync,
  utimesSync,
  readFileSync,
} from 'fs-extra';
import { resolve, sep, relative, join } from 'path';

const resourcesDir = resolve(
  __dirname,
  '../../apps/picsa-tools/resources-tool/src/assets/resources'
);

/**
 * Create a contents file listing all assets in the app
 * Currently Limited to only resources
 *
 */
function populateResourceContents() {
  const outputPath = join(resourcesDir, 'contents.json');

  let contents = generateFolderFlatMap(
    resourcesDir,
    (p) => p !== 'contents.json'
  );

  if (existsSync(outputPath)) {
    const fileContents = readJsonSync(outputPath);
    contents = updateContentMtimes(fileContents, contents);
  }

  const contentsString = JSON.stringify(contents, null, 2);
  const contentsMd5 = getStringMD5Checksum(contentsString);
  // ignore write if contents unchanged
  if (existsSync(outputPath)) {
    const existingMd5 = getFileMD5Checksum(outputPath);
    if (existingMd5 === contentsMd5) return;
  }
  writeFileSync(outputPath, contentsString);
}

/**
 * When checking out resources from git the modified time will be assigned as
 * local time of checkout, and therefore be different for every user
 * Update local mtimes to reflect the time when the resource was first checked in
 * @param fileContents - contents hashmap as read from local contents.json file
 * @param localContents - contents hashmap as read from local disk
 */
function updateContentMtimes(
  fileContents: Record<string, IContentsEntry>,
  localContents: Record<string, IContentsEntry>
) {
  Object.entries(localContents).forEach(([key, entry]) => {
    const { md5Checksum, modifiedTime, relativePath } = entry;
    const existingEntry = fileContents[key];
    // if md5 checksums same ensure modified times also same
    if (existingEntry?.md5Checksum === md5Checksum) {
      if (existingEntry?.modifiedTime !== modifiedTime) {
        const filePath = resolve(resourcesDir, relativePath);
        // update both contents and the file itself
        localContents[key].modifiedTime = existingEntry.modifiedTime;
        const mtime = new Date(localContents[key].modifiedTime);
        utimesSync(filePath, mtime, mtime);
      }
    }
  });
  return localContents;
}

/**
 * Create a flat json representing nested folder structure of a given folder path.
 * Includes stats output that records file size and md5 checksum data
 * 
 * @param filterFn optional filter function to be applied to relative paths for inclusion
 * 
 * @returns Example file: i18n/flags/gb.svg
 * ```
 * "i18n/flags/gb.svg": {
    "size": 538,
    "checksum": "d3ddd6025a06a78535b0d432d14905bf"
  },
 * ```
 */
function generateFolderFlatMap(
  folderPath: string,
  filterFn = (relativePath: string) => true
) {
  const allFiles = recursiveFindByExtension(folderPath);
  // const relativeFiles = allFiles.map(filepath => path.relative(folderPath, filepath))
  let flatMap: Record<string, IContentsEntry> = {};
  for (const filePath of allFiles) {
    const relativePath = relative(folderPath, filePath).split(sep).join('/');
    const shouldInclude = filterFn(relativePath);
    if (shouldInclude) {
      // generate size and md5 checksum stats
      const { size, mtime } = statSync(filePath);
      const modifiedTime = mtime.toISOString();
      // write size in kb to 1 dpclear
      const size_kb = Math.round(size / 102.4) / 10;
      const md5Checksum = getFileMD5Checksum(filePath);
      const entry: IContentsEntry = {
        relativePath,
        size_kb,
        md5Checksum,
        modifiedTime,
      };
      flatMap[relativePath] = entry;
    }
  }

  return flatMap;
}

/**
 * find files by a given extension recursively, returning full paths
 * @param ext - file extension (without '.'), e.g. 'xlsx' or 'json' (leave blank for all files)
 */
function recursiveFindByExtension(
  base: string,
  ext?: string,
  files?: string[],
  result?: string[]
): string[] {
  files = files || readdirSync(base);
  result = result || [];
  for (const file of files) {
    const newbase = join(base, file);
    if (statSync(newbase).isDirectory()) {
      const newFiles = readdirSync(newbase);
      result = recursiveFindByExtension(newbase, ext, newFiles, result);
    } else {
      if (ext) {
        if (file.split('.').pop() === ext) {
          result!.push(newbase);
        }
      } else {
        result!.push(newbase);
      }
    }
  }
  return result as string[];
}

export interface IContentsEntry {
  relativePath: string;
  size_kb: number;
  modifiedTime: string;
  md5Checksum: string;
}

export function getFileMD5Checksum(filePath: string) {
  const hash = createHash('md5', {});
  const fileBuffer = readFileSync(filePath);
  hash.update(fileBuffer);
  const checksum = hash.digest('hex');
  return checksum;
}

export function getStringMD5Checksum(str: string) {
  return createHash('md5', {}).update(str).digest('hex');
}

if (require.main === module) {
  populateResourceContents();
}
