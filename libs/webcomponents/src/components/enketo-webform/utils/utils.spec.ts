import { MOCK_DATA } from '../test/fixtures';
import { jsonToXML, xmlToJson } from './utils';

describe('utils', () => {
  it('converts json to xml', () => {
    const testJSON = { str: 'hello', num: 1 };
    const xml = jsonToXML(testJSON);
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
    const json = await xmlToJson(xml);
    // Keys will be ordered
    expect(json).toEqual({ root: { num: ['1'], str: ['hello'] } });
  });

  it('converts submission xml to json', async () => {
    const json = await xmlToJson(MOCK_DATA.xml.submission);
    // Keys will be ordered
    expect(json).toHaveProperty('aM3XZ9L3BCjqDVq7CeutZ6');
    expect(json.aM3XZ9L3BCjqDVq7CeutZ6).toHaveProperty('$');
  });
});
