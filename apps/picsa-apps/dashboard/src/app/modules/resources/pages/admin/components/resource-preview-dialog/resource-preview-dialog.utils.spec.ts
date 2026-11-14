import { toResourcePreviewData } from './resource-preview-dialog.utils';

const FILES = [{ id: 'gap', title: 'GAP manual' }];
const LINKS = [{ id: 'accessAg', title: 'Access Agriculture' }];

describe('toResourcePreviewData', () => {
  it('should map file row to public url and pdf kind', () => {
    const data = toResourcePreviewData(
      {
        kind: 'File',
        title: 'GAP manual',
        status: 'Missing in App',
        dbItem: {
          id: 'gap',
          title: 'GAP manual',
          storage_file: 'mw/resources/gap.pdf',
          mimetype: 'application/pdf',
        },
      },
      FILES,
      LINKS,
    );
    expect(data.fileUrl).toContain('mw/resources/gap.pdf');
    expect(data.fileKind).toBe('pdf');
    expect(data.bundledOnly).toBe(false);
  });

  it('should detect video files by mimetype', () => {
    const data = toResourcePreviewData(
      {
        kind: 'File',
        title: 'Clip',
        status: 'Missing in App',
        dbItem: { id: 'vid', title: 'Clip', storage_file: 'mw/resources/clip.mp4', mimetype: 'video/mp4' },
      },
      FILES,
      LINKS,
    );
    expect(data.fileKind).toBe('video');
    expect(data.fileUrl).toContain('clip.mp4');
  });

  it('should fall back to external url with generic kind', () => {
    const data = toResourcePreviewData(
      {
        kind: 'File',
        title: 'External',
        status: 'In Sync',
        dbItem: { id: 'ext', title: 'External', external_url: 'https://example.com/doc' },
      },
      FILES,
      LINKS,
    );
    expect(data.fileUrl).toBe('https://example.com/doc');
    expect(data.fileKind).toBe('generic');
  });

  it('should return empty file url and null kind when no file attached', () => {
    const data = toResourcePreviewData(
      { kind: 'File', title: 'Empty', status: 'Differs', dbItem: { id: 'empty', title: 'Empty' } },
      FILES,
      LINKS,
    );
    expect(data.fileUrl).toBe('');
    expect(data.fileKind).toBeNull();
  });

  it('should map link row url', () => {
    const data = toResourcePreviewData(
      {
        kind: 'Link',
        title: 'Access Agriculture',
        status: 'In Sync',
        dbItem: { id: 'accessAg', title: 'Access Agriculture', url: 'https://www.accessagriculture.org' },
      },
      FILES,
      LINKS,
    );
    expect(data.linkUrl).toBe('https://www.accessagriculture.org');
  });

  it('should resolve collection member titles with id fallback', () => {
    const data = toResourcePreviewData(
      {
        kind: 'Collection',
        title: 'Crops',
        status: 'Missing in App',
        dbItem: { id: 'col', title: 'Crops', resource_files: ['gap', 'unknown'], resource_links: ['accessAg'] },
      },
      FILES,
      LINKS,
    );
    expect(data.files).toEqual([
      { id: 'gap', title: 'GAP manual' },
      { id: 'unknown', title: 'unknown' },
    ]);
    expect(data.links).toEqual([{ id: 'accessAg', title: 'Access Agriculture' }]);
  });

  it('should flag bundled-only rows and read from app copy', () => {
    const data = toResourcePreviewData(
      {
        kind: 'File',
        title: 'Bundled',
        status: 'Orphaned in App',
        appItem: { id: 'b1', title: 'Bundled', storage_file: 'mw/resources/b.pdf', mimetype: 'application/pdf' },
      },
      FILES,
      LINKS,
    );
    expect(data.bundledOnly).toBe(true);
    expect(data.fileUrl).toContain('mw/resources/b.pdf');
    expect(data.fileKind).toBe('pdf');
  });
});
