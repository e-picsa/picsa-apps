import * as core from '@actions/core';
import { apkDownload } from './apkDownload';
import * as google from '@googleapis/androidpublisher';
import { unlink, writeFile } from 'fs/promises';
import { exit } from 'process';

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

async function run() {
  try {
    const serviceAccountJson = core.getInput('serviceAccountJson', {
      required: false,
    });
    const serviceAccountJsonRaw = core.getInput('serviceAccountJsonPlainText', {
      required: false,
    });
    const packageName = core.getInput('packageName', { required: true });
    const versionCode = core.getInput('versionCode', { required: true });
    await validateServiceAccountJson(serviceAccountJsonRaw, serviceAccountJson);
    const authClient = await auth.getClient();

    const result = await apkDownload({
      auth: authClient,
      applicationId: packageName,
      versionCode: +versionCode,
    });

    if (result) {
      console.log(`Finished uploading to the Play Store: ${result}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred.');
    }
  } finally {
    if (core.getInput('serviceAccountJsonPlainText', { required: false })) {
      // Cleanup our auth file that we created.
      core.debug('Cleaning up service account json file');
      await unlink('./serviceAccountJson.json');
    }
  }
}

async function validateServiceAccountJson(
  serviceAccountJsonRaw: string | undefined,
  serviceAccountJson: string | undefined
) {
  if (serviceAccountJson && serviceAccountJsonRaw) {
    // If the user provided both, print a warning one will be ignored
    core.warning(
      "Both 'serviceAccountJsonPlainText' and 'serviceAccountJson' were provided! 'serviceAccountJson' will be ignored."
    );
  }

  if (serviceAccountJsonRaw) {
    // If the user has provided the raw plain text, then write to file and set appropriate env variable
    const serviceAccountFile = './serviceAccountJson.json';
    await writeFile(serviceAccountFile, serviceAccountJsonRaw, {
      encoding: 'utf8',
    });
    core.exportVariable('GOOGLE_APPLICATION_CREDENTIALS', serviceAccountFile);
  } else if (serviceAccountJson) {
    // If the user has provided the json path, then set appropriate env variable
    core.exportVariable('GOOGLE_APPLICATION_CREDENTIALS', serviceAccountJson);
  } else {
    // If the user provided neither, fail and exit
    core.setFailed(
      "You must provide one of 'serviceAccountJsonPlainText' or 'serviceAccountJson' to use this action"
    );
    exit();
  }
}

void run();
