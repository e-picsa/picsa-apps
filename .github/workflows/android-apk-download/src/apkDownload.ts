import * as google from '@googleapis/androidpublisher';
import { androidpublisher_v3 } from '@googleapis/androidpublisher';

import AndroidPublisher = androidpublisher_v3.Androidpublisher;
import { Compute } from 'google-auth-library/build/src/auth/computeclient';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { createWriteStream, statSync } from 'fs';

const androidPublisher: AndroidPublisher = google.androidpublisher('v3');

export interface EditOptions {
  auth: Compute | JSONClient;
  applicationId: string;
  versionCode: number;
}

export async function apkDownload(
  options: EditOptions
): Promise<string | void> {
  const { auth, versionCode } = options;
  // Get a list of available apks for version code
  const listRes = await androidPublisher.generatedapks.list({
    auth,
    packageName: options.applicationId,
    versionCode,
  });
  const apksByKey = listRes.data.generatedApks || [];
  console.log(`apks found for ${apksByKey.length} keys`);
  if (apksByKey[0]) {
    // Get id for universal apk and download
    const { generatedUniversalApk } = apksByKey[0];
    console.log(generatedUniversalApk);
    if (generatedUniversalApk) {
      await downloadApk(options, generatedUniversalApk.downloadId as string);
      return;
    }
  }

  return;
}

function downloadApk(options: EditOptions, downloadId: string) {
  const { auth, versionCode } = options;
  const fileName = `${versionCode}.apk`;
  const filePath = `./${fileName}`;
  console.log('downloading apk', downloadId);
  return new Promise((resolve, reject) => {
    androidPublisher.generatedapks.download(
      {
        auth,
        packageName: options.applicationId,
        versionCode,
        downloadId,
        alt: 'media',
      },
      { responseType: 'stream' },
      (err, res) => {
        if (err) {
          console.error('dl fail', err);
          reject(err);
        } else {
          res!.data
            .on('end', function () {
              console.log('Done');
              statSync(filePath);
              resolve(true);
            })
            .on('error', function (err) {
              console.log('Error during download', err);
              reject(err);
            })
            .pipe(createWriteStream(filePath));
        }
      }
    );
  });
}
