import fetch from 'jest-fetch-mock';
fetch.enableMocks();

import { KoboService } from './kobo-service';
import { MOCK_DATA } from './test/fixtures';

const MOCK_TOKEN = 'abcd1234';

/**
 * NOTE - compile wil fail trying to bundle files - prefer e2e tests instead
 */
describe('kobo-service', () => {
  let service: KoboService;

  beforeEach(() => {
    fetch.resetMocks();
    service = new KoboService({ authToken: MOCK_TOKEN });
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
    expect(options.headers).toEqual({
      Authentication: 'Token abcd1234',
      'Content-Type': 'multipart/form-data',
      'X-OpenRosa-Version': '1.0',
    });

    const body = options.body as FormData;
    expect(body.has('xml_submission_file')).toEqual(true);
    const xmlFile = body.get('xml_submission_file') as File;
    expect(xmlFile.type).toEqual('application/xml');
  });
  it('handles successful submission', async () => {
    fetch.mockOnce(MOCK_DATA.xml.responseSuccess, { status: 200 });
    const res = await service.submitXMLSubmission(MOCK_DATA.xml.submission);
    expect(res.data).toEqual({
      message: ['Successful submission.'],
      submissionMetadata: [
        {
          $: {
            id: 'aM3XZ9L3BCjqDVq7CeutZ6',
            instanceID: 'uuid:afca73df-a61c-440b-9be2-a904700c66df',
            isComplete: 'true',
            markedAsCompleteDate: '2023-05-15T23:46:03.621349+00:00',
            submissionDate: '2023-05-15T23:46:03.621333+00:00',
            xmlns: 'http://www.opendatakit.org/xforms',
          },
        },
      ],
    });
  });
  it('handles handles duplicate submission', async () => {
    fetch.mockOnce(MOCK_DATA.xml.responseDuplicate, { status: 202 });
    const res = await service.submitXMLSubmission(MOCK_DATA.xml.submission);
    expect(res.data).toEqual({
      message: [{ _: 'Duplicate submission', $: { nature: '' } }],
    });
  });
});
