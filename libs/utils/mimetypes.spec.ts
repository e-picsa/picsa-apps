import { getMimeType, isFilenameValidForMime } from './mimetypes';

describe('mimetypes', () => {
  it('should resolve .html and .htm mime types', () => {
    expect(getMimeType('sample_weekly.html')).toBe('text/html');
    expect(getMimeType('sample_weekly.htm')).toBe('text/html');
    expect(isFilenameValidForMime('test.html', 'text/html')).toBe(true);
  });

  it('should resolve .pdf and .csv mime types', () => {
    expect(getMimeType('sample_daily.pdf')).toBe('application/pdf');
    expect(getMimeType('data.csv')).toBe('text/csv');
  });
});
