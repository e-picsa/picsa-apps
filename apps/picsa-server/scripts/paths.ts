import path from 'path';

const serverDir = path.resolve(__dirname, '../');
const migrationsDir = path.resolve(__dirname, 'migrations');
const seedDir = path.resolve(__dirname, 'seed');

const seedFilesDir = path.resolve(seedDir, 'files');

const cloudFunctionsDist = path.resolve(serverDir, 'cloud-functions', 'dist');
const dockerCloudFunctionsDist = path.resolve(
  serverDir,
  'docker',
  'cloud-functions'
);
const envFilePath = path.resolve(serverDir, '.env');
const generatedTSdir = path.resolve(serverDir, 'generated', 'schema');

export const PATHS = {
  cloudFunctionsDist,
  dockerCloudFunctionsDist,
  envFilePath,
  generatedTSdir,
  migrationsDir,
  serverDir,
  seedFilesDir,
};
