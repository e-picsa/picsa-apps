import path from 'path';
import fs from 'fs';
import execa from 'execa';

export async function zipFolderContents(folderPath: string, outputZipPath: string) {
  // Ensure the folder exists
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new Error(`Error: Folder not found or is not a directory at '${folderPath}'`);
  }
  // Ensure the parent directory for the output zip exists
  const outputDir = path.dirname(outputZipPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Construct the tar command and arguments.
  // -c: create
  // -a: auto-detect archive format (will use .zip based on extension)
  // -f: specify archive file
  // -C: change directory before adding files (important to include contents, not the folder itself)
  const command = 'tar';
  const args = [
    '-c',
    '-a',
    '-f',
    outputZipPath,
    '-C',
    folderPath,
    '.', // This tells tar to include all contents of the current directory (folderPath)
  ];

  return execa(command, args);
}
