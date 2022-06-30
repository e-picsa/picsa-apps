import path from 'path';
const workspaceDir = path.resolve(__dirname, '../');
const cloudFunctionsDist = path.resolve(
  workspaceDir,
  'cloud-functions',
  'dist'
);
const dockerCloudFunctionsDist = path.resolve(
  workspaceDir,
  'docker',
  'cloud-functions'
);

export const PATHS = { cloudFunctionsDist, dockerCloudFunctionsDist };
