import { parseDataUri } from './screenshot.service';

describe('ScreenshotService pure helpers', () => {
  it('parses a png data uri', () => {
    const result = parseDataUri('data:image/png;base64,SGVsbG8=');
    expect(result).toEqual({ base64: 'SGVsbG8=', type: 'image/png' });
  });

  it('parses a jpeg data uri', () => {
    const result = parseDataUri('data:image/jpeg;base64,/9j/abc');
    expect(result).toEqual({ base64: '/9j/abc', type: 'image/jpeg' });
  });

  it('returns null for invalid data uri', () => {
    expect(parseDataUri('not-a-data-uri')).toBeNull();
  });

  it('downscaleBase64 passes through small payloads', async () => {
    const { ScreenshotService } = await import('./screenshot.service');
    const small = 'a'.repeat(100);
    const result = await new ScreenshotService().downscaleBase64(small, 'image/png', 5 * 1024 * 1024);
    expect(result.base64).toBe(small);
    expect(result.type).toBe('image/png');
  });
});
