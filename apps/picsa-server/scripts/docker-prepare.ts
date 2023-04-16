import fs from 'fs-extra';

import { PATHS } from './paths';

/**
 * Prepare additional files required for running docker container
 */
async function dockerPrepare() {
  // copy built cloud-functions to docker for binding
  fs.ensureDirSync(PATHS.dockerCloudFunctionsDist);
  fs.emptyDirSync(PATHS.dockerCloudFunctionsDist);
  fs.copySync(PATHS.cloudFunctionsDist, PATHS.dockerCloudFunctionsDist);
}

if (require.main === module) {
  dockerPrepare().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
