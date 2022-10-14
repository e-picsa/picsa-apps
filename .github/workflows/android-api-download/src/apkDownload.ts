import * as google from '@googleapis/androidpublisher';
import { androidpublisher_v3 } from '@googleapis/androidpublisher';

import AndroidPublisher = androidpublisher_v3.Androidpublisher;
import { Compute } from 'google-auth-library/build/src/auth/computeclient';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

const androidPublisher: AndroidPublisher = google.androidpublisher('v3');

export interface EditOptions {
  auth: Compute | JSONClient;
  applicationId: string;
}

export async function apkDownload(
  options: EditOptions
): Promise<string | void> {
  // Check the 'track' for 'internalsharing', if so switch to a non-track api

  const res = await androidPublisher.edits.apks.list({
    auth: options.auth,
    packageName: options.applicationId,
  });
  console.log(res);
  return res.statusText;
}
