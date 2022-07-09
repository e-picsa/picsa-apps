import Parse from 'parse/node';
import path from 'path';
import fs from 'fs-extra';
import { PATHS } from './paths';

import { initializeParseServer } from './utils';
import { recursiveFindByExtension } from './utils/file.utils';

/**
 *
 */
class DBSeed {
  public async run() {
    initializeParseServer();
    await this.uploadFiles();
  }

  /**
   *
   */
  private async uploadFiles() {
    const files = recursiveFindByExtension(PATHS.seedFilesDir).filter(
      (filePath) => !path.basename(filePath).startsWith('.')
    );
    for (const filepath of files) {
      const name = path.basename(filepath);
      const base64 = fs.readFileSync(filepath, { encoding: 'base64' });
      const file = new Parse.File(name, { base64 });
      console.log('upload file', file.name());
      await file.save({ useMasterKey: true });
    }
  }
}

if (require.main === module) {
  new DBSeed().run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
