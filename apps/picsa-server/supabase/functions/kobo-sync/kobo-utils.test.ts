import { assert } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

import {
  createKoboSubmission,
  deleteKoboSubmissionByUUID,
  extractSubmissionXML,
  getKoboSubmission,
  upsertKoboSubmission,
} from './kobo-utils.ts';
import { beforeAll, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { setupTestEnv } from '../tests/test-utils.ts';

/**
 * Kobo Utils Testing
 *
 * TODO
 * - Include QA (e.g. ensure KOBO_API_KEY)
 * - Ensure form contains no entries before population
 */

describe('Kobo Utils', () => {
  const testFormId = 'aLgKwDoHNd38sZyBQMV293';
  let instanceId: string;
  let submissionXML: string;
  /** ID of submission populated to kobo server during tests */
  let koboId: number;
  beforeAll(async () => {
    await setupTestEnv();
    instanceId = crypto.randomUUID();
    submissionXML = mockInstanceXML(testFormId, instanceId);
  });
  it('Extracts submission metadata', async () => {
    const { formId, json } = extractSubmissionXML(submissionXML);
    assert(formId === testFormId);
    assert(json.meta.instanceID === `uuid:${instanceId}`);
  });
  it('Extracts submission metadata (complex)', async () => {
    const { formId, json } = extractSubmissionXML(mockInstanceXMLComplex);
    assert(formId === 'aQCDPoHBUkgJRWQgswksoo');
    assert(json.meta.instanceID === `uuid:f76d05ca-3113-475a-b0c2-3b18b47bfff8`);
  });

  it('Creates new submission and returns metadata', async () => {
    const createRes = await createKoboSubmission(submissionXML);
    assert(createRes.status === 201, 'Submission created succesfully');
    const { submissionMetadata } = createRes.json.OpenRosaResponse;
    assert(submissionMetadata['@instanceID'] === `uuid:${instanceId}`);
  });

  it('Records duplicate submission', async () => {
    const duplicateRes = await createKoboSubmission(submissionXML);
    assert(duplicateRes.status === 202, 'Duplicate submission processed');
    const { message } = duplicateRes;
    assert(message === 'Duplicate submission');
  });

  it('Retrieves a submission by uuid or kobo id', async () => {
    const entryByUUID = await getKoboSubmission(testFormId, instanceId);
    assert(entryByUUID?._id, 'Submission retrieval with kobo _id');
    koboId = entryByUUID!._id;
    const entryByKoboID = await getKoboSubmission(testFormId, koboId);
    assert(entryByKoboID?._id === entryByUUID?._id, 'Submission retrieval with kobo _id matches uuid');
  });

  it('Updates a submission', async () => {
    const upsertRes = await upsertKoboSubmission(submissionXML.replace('<q1>test</q1>', '<q1>test update</q1>'));
    assert(upsertRes.status === 201, 'Submission updated');
  });

  it('Deletes old submission on update', async () => {
    const checkDeleteRes = await getKoboSubmission(testFormId, koboId);
    assert(checkDeleteRes === null);
  });

  it('Deletes a submission', async () => {
    const deleteRes = await deleteKoboSubmissionByUUID(testFormId, instanceId);
    assert(deleteRes.status === 204);
  });
});

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

const mockInstanceXMLComplex = `
<aQCDPoHBUkgJRWQgswksoo xmlns:jr="http://openrosa.org/javarosa"
    xmlns:orx="http://openrosa.org/xforms" id="aQCDPoHBUkgJRWQgswksoo" version="13 (2023-07-23 11:47:12)">
    <formhub>
        <uuid>6047e7f1180a493eb78272460fd38317</uuid>
    </formhub>
    <start>2023-10-16T12:21:58.634-07:00</start>
    <end>2023-10-16T12:21:58.634-07:00</end>
    <date>2023-10-11</date>
    <district>nkhotakota</district>
    <EPA/>
    <section/>
    <name/>
    <farmers_present_header>
        <farmers_present_header_note/>
        <farmers_present_header_u35/>
        <farmers_present_header_o36/>
    </farmers_present_header>
    <farmers_present_35>
        <farmers_present_f_1_note/>
        <farmers_female_35orunder/>
        <farmers_male_35orunder/>
    </farmers_present_35>
    <farmers_present_36>
        <farmers_present_m_1_note/>
        <farmers_female_36orover/>
        <farmers_male_36orover/>
    </farmers_present_36>
    <total_farmers>NaN</total_farmers>
    <Total_Farmers_total_farmers/>
    <activities/>
    <observations/>
    <share_community/>
    <__version__>vJ2qCqJhqh4ZuRkftq5gzE</__version__>
    <meta>
        <instanceID>uuid:f76d05ca-3113-475a-b0c2-3b18b47bfff8</instanceID>
    </meta>
</aQCDPoHBUkgJRWQgswksoo>
`;
