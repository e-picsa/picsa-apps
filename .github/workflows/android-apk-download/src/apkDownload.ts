import * as google from '@googleapis/androidpublisher';
import { androidpublisher_v3 } from '@googleapis/androidpublisher';

import AndroidPublisher = androidpublisher_v3.Androidpublisher;
import { Compute } from 'google-auth-library/build/src/auth/computeclient';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

const androidPublisher: AndroidPublisher = google.androidpublisher('v3');

export interface EditOptions {
  auth: Compute | JSONClient;
  applicationId: string;
  versionCode: number;
}

export async function apkDownload(
  options: EditOptions
): Promise<string | void> {
  // Get a list of available apks for version code
  const res = await androidPublisher.generatedapks.list({
    auth: options.auth,
    packageName: options.applicationId,
    versionCode: options.versionCode,
  });
  const apksByKey = res.data.generatedApks || [];
  console.log(`apks found for ${apksByKey.length} keys`);
  if (apksByKey[0]) {
    // Get id for universal apk and download
    const { generatedUniversalApk } = apksByKey[0];
    console.log(generatedUniversalApk);
    if (generatedUniversalApk) {
      const dlRes = await androidPublisher.generatedapks.download({
        auth: options.auth,
        packageName: options.applicationId,
        versionCode: options.versionCode,
        downloadId: generatedUniversalApk.downloadId as string,
        alt: 'media',
      });
      console.log(dlRes.data);
    }
  }

  return res.statusText;
}
