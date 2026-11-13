import { safeDecodeURIComponent } from './string.utils';

describe('string.utils', () => {
  describe('safeDecodeURIComponent', () => {
    it('returns regular strings unchanged', () => {
      expect(safeDecodeURIComponent('plain-filename.pdf')).toBe('plain-filename.pdf');
      expect(safeDecodeURIComponent('')).toBe('');
    });

    it('decodes percent-encoded characters including spaces and symbols', () => {
      expect(safeDecodeURIComponent('Forecast%20Terminology_Draft.pdf')).toBe('Forecast Terminology_Draft.pdf');
      expect(safeDecodeURIComponent('path%2Fto%2Ffile.pdf')).toBe('path/to/file.pdf');
      expect(safeDecodeURIComponent('%40%40%20special%20%C3%A9.pdf')).toBe('@@ special é.pdf');
    });

    it('safely falls back to the original value when encountering malformed URI sequences', () => {
      // Malformed percent-encoding that throws URIError in standard decodeURIComponent
      const malformed = '%E0%A4%A';
      expect(() => decodeURIComponent(malformed)).toThrow(URIError);
      expect(safeDecodeURIComponent(malformed)).toBe(malformed);
    });
  });
});
