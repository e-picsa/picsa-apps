import { createReadStream, writeFileSync } from 'fs';
import fetch from 'jest-fetch-mock';
import { tmpdir } from 'os';
import { resolve } from 'path';

import { KoboService } from './kobo-service';
import { MOCK_DATA } from './test/fixtures';
import * as utils from './utils/utils';

fetch.enableMocks();
const MOCK_TOKEN = 'test1234';

/**
 * NOTE - compile wil fail trying to bundle files - prefer e2e tests instead
 */
describe('kobo-service', () => {
  let service: KoboService;

  beforeEach(() => {
    fetch.resetMocks();
    service = new KoboService({ authToken: MOCK_TOKEN });

    // HACK - node-based runner does not have access to File() constructor
    // Manually create a file to include instead
    jest.spyOn(utils, 'xmlStringToFile').mockImplementation((xmlString) => {
      const tmpFilePath = resolve(tmpdir(), 'tmp.xml');
      writeFileSync(tmpFilePath, xmlString);
      const readStream = createReadStream(tmpFilePath);
      return readStream as any;
    });
  });
  it('creates service', async () => {
    expect(service).not.toBeUndefined();
  });
  it('posts xml file submission', async () => {
    fetch.mockOnce(MOCK_DATA.xml.responseSuccess, { status: 200 });
    await service.submitXMLSubmission(MOCK_DATA.xml.submission);
    // test request formatting
    expect(fetch.mock.calls.length).toEqual(1);
    const [endpoint, options] = fetch.mock.lastCall;
    expect(endpoint).toEqual('https://kc.kobotoolbox.org/api/v1/submissions');
    expect(options.method).toEqual('POST');
    expect(options.headers['Authorization']).toEqual(`Token ${MOCK_TOKEN}`);
    expect(options.headers['X-OpenRosa-Version']).toEqual('1.0');
    expect(options.headers['content-type']).toContain('multipart/form-data; boundary=----');

    // TODO - when sending from browser body FormData structured differently to node env
    // const body = options.body as any;
    // console.log('body', body);
    // expect(body.has('xml_submission_file')).toEqual(true);
    // const xmlFile = body.get('xml_submission_file') as File;
    // expect(xmlFile.type).toEqual('application/xml');
  });
  it('handles successful submission', async () => {
    fetch.mockOnce(MOCK_DATA.xml.responseSuccess, { status: 200 });
    const { data } = await service.submitXMLSubmission(MOCK_DATA.xml.submission);
    expect(data['message']).toEqual('Successful submission.');
    expect(data).toHaveProperty('submissionMetadata');
  });
  it('handles handles duplicate submission', async () => {
    fetch.mockOnce(MOCK_DATA.xml.responseDuplicate, { status: 202 });
    const { data } = await service.submitXMLSubmission(MOCK_DATA.xml.submission);
    expect(data['message']).toEqual('Duplicate submission');
  });
});
