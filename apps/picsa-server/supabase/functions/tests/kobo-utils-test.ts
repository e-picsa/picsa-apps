import { assert } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

import {
  createKoboSubmission,
  deleteKoboSubmissionByUUID,
  getKoboSubmission,
  upsertKoboSubmission,
} from '../_kobo/kobo-utils.ts';

/**
 * Kobo Utils Testing
 *
 * TODO
 * - Split to separate test functions
 * - Include QA (e.g. ensure KOBO_API_KEY)
 * - Ensure form contains no entries before population
 * - Use dedicated testing .env
 */
export const testKoboUtils = async () => {
  const testFormId = 'aLgKwDoHNd38sZyBQMV293';

  const instanceId = crypto.randomUUID();
  const submissionXML = mockInstanceXML(testFormId, instanceId);

  // it("Creates new submission")
  const createRes = await createKoboSubmission(submissionXML);
  assert(createRes.status === 201, 'Submission created succesfully');

  // it("Returns submission metadata")
  const { submissionMetadata } = createRes.json.OpenRosaResponse;
  assert(submissionMetadata['@instanceID'] === `uuid:${instanceId}`);

  // it("Records duplicate submission")
  const duplicateRes = await createKoboSubmission(submissionXML);
  assert(duplicateRes.status === 202, 'Duplicate submission processed');

  // it("Returns duplicate submission text")
  const { message } = duplicateRes;
  assert(message === 'Duplicate submission');

  // it("Retrieves a submission by uuid")
  const entryByUUID = await getKoboSubmission(testFormId, instanceId);
  assert(entryByUUID?._id, 'Submission retrieval with kobo _id');

  // it("Retrieves same submission by kobo id")
  const _koboID = entryByUUID!._id;
  const entryByKoboID = await getKoboSubmission(testFormId, _koboID);
  assert(entryByKoboID?._id === entryByUUID?._id, 'Submission retrieval with kobo _id matches uuid');

  // it("Updates a submission")
  const upsertRes = await upsertKoboSubmission(submissionXML.replace('<q1>test</q1>', '<q1>test update</q1>'));
  assert(upsertRes.status === 201, 'Submission updated');

  // it("Deletes old submission on update")
  const checkDeleteRes = await getKoboSubmission(testFormId, _koboID);
  assert(checkDeleteRes === null);

  // it("Deletes a submission")
  const deleteRes = await deleteKoboSubmissionByUUID(testFormId, instanceId);
  assert(deleteRes.status === 204);
};

/** Mock form instance submission xml generator */
function mockInstanceXML(formId: string, instanceID: string) {
  return `
<?xml version="1.0" encoding="utf-8"?>
<${formId} xmlns:jr="http://openrosa.org/javarosa"
    xmlns:orx="http://openrosa.org/xforms" id="${formId}" version="1 (2023-05-15 11:11:37)">
    <formhub>
        <uuid>e2bf18a988214fe09c18e6b70298959a</uuid>
    </formhub>
    <start>2023-10-12T13:47:32.569-07:00</start>
    <end>2023-10-12T13:47:35.485-07:00</end>
    <q1>test</q1>
    <__version__>vJ8FXDvzh4rCWFBUbjfnPs</__version__>
    <meta>
        <instanceID>uuid:${instanceID}</instanceID>
    </meta>
</${formId}>`;
}

// deno-lint-ignore no-unused-vars
const mockNotFoundResponse = `<?xml version="1.0" encoding="utf-8"?>
<root>
	<detail>Not found.</detail>
</root>`;

// deno-lint-ignore no-unused-vars
const mockSucessResposne = `<OpenRosaResponse xmlns="http://openrosa.org/http/response">
<message>Successful submission.</message>
<submissionMetadata xmlns="http://www.opendatakit.org/xforms" id="aLgKwDoHNd38sZyBQMV293"  instanceID="uuid:da4547c9-1c35-44fb-975d-e4913b37ef10" submissionDate="2023-10-15T00:38:12.641264+00:00" isComplete="true" markedAsCompleteDate="2023-10-15T00:38:12.641281+00:00"/>
</OpenRosaResponse>`;

// deno-lint-ignore no-unused-vars
const mockDuplicateResponse = `<?xml version='1.0' encoding='UTF-8' ?>
<OpenRosaResponse xmlns="http://openrosa.org/http/response">
        <message nature="">Duplicate submission</message>
</OpenRosaResponse>`;
