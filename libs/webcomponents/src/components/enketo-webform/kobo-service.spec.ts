// import { MockRequest } from '@stencil/core/testing';

import { KoboService } from './kobo-service';
import { MOCK_DATA } from './test/fixtures';

/**
 * NOTE - compile wil fail trying to bundle files - prefer e2e tests instead
 */
describe('kobo-service', () => {
  let service: KoboService;

  beforeEach(() => {
    service = new KoboService();
  });
  it('creates service', async () => {
    expect(service).not.toBeUndefined();
  });

  it('converts json to xml', () => {
    const testJSON = { str: 'hello', num: 1 };
    const xml = KoboService.jsonToXML(testJSON);
    expect(xml).toEqual(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<root>\n' +
        '  <str>hello</str>\n' +
        '  <num>1</num>\n' +
        '</root>'
    );
  });

  it('converts xml to json (non-fidelity)', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<root>\n' +
      '  <str>hello</str>\n' +
      '  <num>1</num>\n' +
      '</root>';
    const json = await KoboService.xmlToJson(xml);
    // Keys will be ordered
    expect(json).toEqual({ root: { num: ['1'], str: ['hello'] } });
  });
  it('converts submission xml to json', async () => {
    const json = await KoboService.xmlToJson(MOCK_DATA.SUBMISSION_XML);
    console.log('json', JSON.stringify(json, null, 2));

    // Keys will be ordered
    expect(json).toHaveProperty('aM3XZ9L3BCjqDVq7CeutZ6');
    expect(json.aM3XZ9L3BCjqDVq7CeutZ6).toHaveProperty('$');
  });
});
