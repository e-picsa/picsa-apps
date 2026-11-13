import { getFileFallbackType } from './resource-cover.utils';
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
