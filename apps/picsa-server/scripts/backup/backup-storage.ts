import type { FileObject } from '@supabase/storage-js';
import fs from 'fs';
import path, { relative, resolve } from 'path';
import crypto from 'crypto';
import { zipFolderContents } from '../utils/file.utils';
import { getRemoteSupabaseClient } from '../utils/supabase.utils';

interface IFileMeta extends FileObject {
  bucketName: string;
  /** Fully qualified storage path (excluding bucket prefix) */
  filePath: string;
}

const localDir = path.resolve(__dirname, './cache');
const backupDir = path.resolve(__dirname, './backups');

/** List of folders to exclude from local backup */
const omitDirs = ['forecasts'];

/** List of buckets to exclude from local backup */
const omitBuckets: string[] = [];

/** Export all supabase storage files to local cache and store as timestamped archive */
export async function backupStorage() {
  console.log('Starting sync process...');

  // Create local directory if it doesn't exist
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  // Get all remote files
  const buckets = await listBuckets();

  for (const { name: bucketName } of buckets) {
    console.log('\n');
    const bucketFiles = await listFiles(bucketName);
    console.log(`[ ${bucketName} ]\n`);
    console.log(`Files: ${bucketFiles.length}`);
    await syncFiles(bucketFiles);
    removeOrphaned(bucketName, bucketFiles);
  }

  const outputName = new Date().toISOString().substring(0, 10);
  const outputPath = resolve(backupDir, `${outputName}.tar`);
  await zipFolderContents(localDir, outputPath);
  console.log(`Backup complete`, outputPath);
}

async function syncFiles(remoteFiles: IFileMeta[]) {
  // Process each file
  let downloadCount = 0;
  let skipCount = 0;
  let errors: any[] = [];

  for (const remoteFile of remoteFiles) {
    const { downloaded, skipped, error } = await syncFile(remoteFile);
    if (downloaded) downloadCount++;
    if (skipped) skipCount++;
    if (error) errors.push(error);
  }

  console.log(`Downloaded: ${downloadCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.error(errors);
    process.exit(1);
  }
}
async function syncFile(remoteFile: IFileMeta) {
  const supabase = getRemoteSupabaseClient();
  const status = { downloaded: false, skipped: false, error: null as any };
  const { filePath, created_at, updated_at, bucketName, metadata } = remoteFile;
  const localFilePath = path.join(localDir, bucketName, filePath);
  const localFileDir = path.dirname(localFilePath);

  // Ensure directory exists
  if (!fs.existsSync(localFileDir)) {
    fs.mkdirSync(localFileDir, { recursive: true });
  }

  // Check if file exists locally
  const fileExists = fs.existsSync(localFilePath);

  if (fileExists) {
    // Compare file sizes first (quick check)
    const localStats = fs.statSync(localFilePath);

    if (localStats.size === metadata.size) {
      // console.log(`[ ] ${filePath}`);
      status.skipped = true;
      return status;
    }
  }

  // Download the file
  console.log(`[+] ${filePath}`);
  const { data, error: downloadError } = await supabase.storage.from(bucketName).download(filePath);

  if (downloadError) {
    console.log(`[E] ${filePath}`);
    console.error(downloadError);
    status.error = downloadError;
    return status;
  }

  // Save the file
  fs.writeFileSync(localFilePath, Buffer.from(await data.arrayBuffer()));
  fs.utimesSync(localFilePath, new Date(created_at), new Date(updated_at));

  status.downloaded = true;
  return status;
}

function removeOrphaned(bucketName: string, remoteFiles: IFileMeta[]) {
  let removedCount = 0;

  const baseDir = resolve(localDir, bucketName);

  if (!fs.existsSync(baseDir)) {
    return;
  }

  const remoteHashmap = remoteFiles.reduce((map, f) => {
    map.set(f.filePath, f);
    return map;
  }, new Map<string, IFileMeta>());

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const childPath = resolve(dir, file.name);
      if (file.isDirectory()) {
        walkDir(childPath);
      } else {
        const relativePath = relative(baseDir, childPath).replace(/\\/g, '/');
        if (!remoteHashmap.has(relativePath)) {
          console.log(`[-] ${relativePath}`);
          fs.unlinkSync(childPath);
          removedCount++;
        }
      }
    }
    // Clean up empty subdirectories (except base directory)
    const remainingFiles = fs.readdirSync(dir);
    if (remainingFiles.length === 0 && dir !== baseDir) {
      fs.rmdirSync(dir);
    }
  }

  walkDir(baseDir);
  console.log(`Removed: ${removedCount}`);
}

// Calculate MD5 hash of a file
function calculateMD5(filePath: string) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function listBuckets() {
  const supabase = getRemoteSupabaseClient();
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (!error && data && data.length > 0) {
      return data.filter(({ name }) => !omitBuckets.includes(name));
    }
  } catch {
    // Ignore listBuckets API error for non-service-role keys
  }

  // Fallback for anon key: query distinct bucket_ids dynamically from storage.objects table
  const { data: objectRows, error: dbError } = await supabase
    .schema('storage' as any)
    .from('objects')
    .select('bucket_id');

  if (dbError || !objectRows) {
    throw new Error(`Failed to list storage buckets from storage.objects: ${dbError?.message || 'No data returned'}`);
  }

  const uniqueBucketNames = Array.from(new Set(objectRows.map((r: any) => r.bucket_id))).filter(
    (name): name is string => Boolean(name) && !omitBuckets.includes(name),
  );

  return uniqueBucketNames.map((name) => ({ name, id: name, public: true }));
}

// List all files in the bucket (recursively)
async function listFiles(bucketName: string, prefix = '') {
  const supabase = getRemoteSupabaseClient();
  // skip list of omitted files
  if (omitDirs.includes(prefix)) return [];

  // Try standard storage list API first
  const { data, error } = await supabase.storage.from(bucketName).list(prefix);

  if (!error && data) {
    let allFiles: IFileMeta[] = [];
    for (const item of data) {
      if (item.id) {
        // It's a file
        const filePath = prefix ? `${prefix}/${item.name}` : item.name;
        allFiles.push({ ...item, filePath, bucketName });
      } else {
        // It's a folder
        const subPrefix = prefix ? `${prefix}/${item.name}` : item.name;
        const subFiles = await listFiles(bucketName, subPrefix);
        allFiles = [...allFiles, ...subFiles];
      }
    }
    return allFiles;
  }

  // Fallback for anon key: Query storage.objects table directly (works under public RLS policies)
  let query = supabase
    .schema('storage' as any)
    .from('objects')
    .select('id, name, created_at, updated_at, metadata')
    .eq('bucket_id', bucketName);

  if (prefix) {
    query = query.like('name', `${prefix}/%`);
  }

  const { data: dbObjects, error: dbErr } = await query;

  if (dbErr || !dbObjects) {
    console.error(`Error querying storage.objects for bucket ${bucketName}:`, dbErr);
    return [];
  }

  return dbObjects
    .filter((obj: any) => {
      // Exclude omitted directories
      if (omitDirs.some((d) => obj.name.startsWith(`${d}/`) || obj.name === d)) {
        return false;
      }
      return true;
    })
    .map((obj: any) => ({
      id: obj.id,
      name: path.basename(obj.name),
      created_at: obj.created_at,
      updated_at: obj.updated_at,
      metadata: obj.metadata || {},
      filePath: obj.name,
      bucketName,
    }));
}

if (require.main === module) {
  backupStorage();
}
