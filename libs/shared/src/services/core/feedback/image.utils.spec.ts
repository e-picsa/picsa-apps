import { base64ToBlob, detectImageMimeType, downscaleBase64, parseDataUri } from './image.utils';

describe('image.utils', () => {
  describe('detectImageMimeType', () => {
    it('detects PNG magic bytes', () => {
      // 89 50 4E 47
      const pngBase64 = btoa(String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a));
      expect(detectImageMimeType(pngBase64)).toBe('image/png');
    });

    it('detects JPEG magic bytes', () => {
      // FF D8 FF
      const jpegBase64 = btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0));
      expect(detectImageMimeType(jpegBase64)).toBe('image/jpeg');
    });

    it('detects WebP magic bytes', () => {
      // RIFF....WEBP
      const webpBase64 = btoa('RIFF1234WEBP');
      expect(detectImageMimeType(webpBase64)).toBe('image/webp');
    });

    it('falls back to image/png on unrecognized or corrupt input', () => {
      expect(detectImageMimeType('not-base-64!!!')).toBe('image/png');
      expect(detectImageMimeType(btoa('plain text'))).toBe('image/png');
    });
  });

  describe('parseDataUri', () => {
    it('parses valid png data URI', () => {
      const result = parseDataUri('data:image/png;base64,SGVsbG8=');
      expect(result).toEqual({ base64: 'SGVsbG8=', type: 'image/png' });
    });

    it('parses valid jpeg data URI', () => {
      const result = parseDataUri('data:image/jpeg;base64,/9j/abc');
      expect(result).toEqual({ base64: '/9j/abc', type: 'image/jpeg' });
    });

    it('returns null for invalid data URI', () => {
      expect(parseDataUri('http://example.com/image.png')).toBeNull();
      expect(parseDataUri('plain-string')).toBeNull();
      expect(parseDataUri('')).toBeNull();
    });
  });

  describe('base64ToBlob', () => {
    it('converts base64 string to Blob with correct MIME type and size', async () => {
      const text = 'Hello world!';
      const b64 = btoa(text);
      const blob = base64ToBlob(b64, 'text/plain');
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBe(text.length);
    });
  });

  describe('downscaleBase64', () => {
    it('passes through small payloads without re-encoding', async () => {
      const small = 'a'.repeat(100);
      const result = await downscaleBase64(small, 'image/png', 1000);
      expect(result.base64).toBe(small);
      expect(result.type).toBe('image/png');
    });
  });
});
