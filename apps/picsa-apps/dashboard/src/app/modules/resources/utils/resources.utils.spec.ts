import { getFileFallbackType, normalizeBundledCoverPath } from './resource-cover.utils';
import { getCollectionHierarchy } from './resources.utils';

describe('resource-cover.utils', () => {
  it('maps mimetypes to corresponding fallback image types', () => {
    expect(getFileFallbackType('application/pdf')).toBe('pdf');
    expect(getFileFallbackType('video/mp4')).toBe('video');
    expect(getFileFallbackType('video/webm')).toBe('video');
    expect(getFileFallbackType('audio/mpeg')).toBe('audio');
    expect(getFileFallbackType('image/png')).toBe('image');
    expect(getFileFallbackType('application/msword')).toBe('document');
    expect(getFileFallbackType(null)).toBe('document');
    expect(getFileFallbackType(undefined)).toBe('document');
  });

  it('normalizes Supabase storage cover paths to bundled asset paths matching sync-resources', () => {
    expect(normalizeBundledCoverPath('global/resources/covers/crops.svg')).toBe('assets/resources/covers/crops.svg');
    expect(normalizeBundledCoverPath('global/resources/covers/access-ag.jpg')).toBe(
      'assets/resources/covers/access-ag.webp',
    );
    expect(normalizeBundledCoverPath('mw/resources/covers/Cover Image.png')).toBe(
      'assets/resources/covers/mw/Cover Image.webp',
    );
    expect(normalizeBundledCoverPath('zw/resources/covers/msd_logo.original.png')).toBe(
      'assets/resources/covers/zw/msd_logo.original.webp',
    );
    expect(normalizeBundledCoverPath('assets/resources/covers/mw/Cover Image.webp')).toBe(
      'assets/resources/covers/mw/Cover Image.webp',
    );
    expect(normalizeBundledCoverPath('https://example.com/cover.png')).toBe('https://example.com/cover.png');
    expect(normalizeBundledCoverPath('')).toBeNull();
    expect(normalizeBundledCoverPath(null)).toBeNull();
  });
});

describe('getCollectionHierarchy', () => {
  const test_data: any[] = [
    { id: '1.1.1.1', collection_parent: '1.1.1' },
    { id: '2' },
    { id: '1.1', collection_parent: '1' },
    { id: '1.2', collection_parent: '1' },
    { id: '1.3', collection_parent: '1' },
    { id: '1.1.1', collection_parent: '1.1' },
    { id: 'hanging_1', collection_parent: 'missing' },
    { id: '1' },
    { id: 'circular_1', collection_parent: 'circular_2' },
    { id: 'circular_2', collection_parent: 'circular_3' },
  ];

  it('builds hierarchy nodes for valid trees', () => {
    const res = getCollectionHierarchy(test_data);
    expect(res).toBeDefined();
    expect(res._nodes).toBeDefined();
  });
});
