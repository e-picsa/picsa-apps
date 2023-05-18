import { MOCK_DATA } from '../test/fixtures';
import { jsonToXML, xmlToJson } from './utils';

describe('utils', () => {
  it('converts json to xml', () => {
    const testJSON = { str: 'hello', num: 1 };
    const xml = jsonToXML(testJSON);
    expect(xml).toEqual('<str>hello</str><num>1</num>');
  });

  it('converts xml to json without attributes', async () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<root>\n' +
      '  <str>hello</str>\n' +
      '  <num>1</num>\n' +
      '</root>';
    const json = xmlToJson(xml);
    expect(json).toEqual({
      '?xml': '',
      root: { str: 'hello', num: 1 },
    });
  });

  it('converts submission xml to json', async () => {
    const json = xmlToJson(MOCK_DATA.xml.submission);
    // Keys will be ordered
    expect(json).toEqual(MOCK_DATA.xml.submissionJSON);
  });
});
