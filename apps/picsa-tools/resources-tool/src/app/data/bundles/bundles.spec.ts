import { resolveCoverImage, resolveFileUrl, RESOURCE_BUNDLES, RESOURCE_MANIFESTS } from './index';

describe('RESOURCE_BUNDLES and RESOURCE_MANIFESTS', () => {
  it('exports country bundles with collections, files, and links', () => {
    expect(RESOURCE_BUNDLES).toBeDefined();
    expect(RESOURCE_BUNDLES['mw']).toBeDefined();
    expect(RESOURCE_BUNDLES['zm']).toBeDefined();
    expect(RESOURCE_BUNDLES['zw']).toBeDefined();

    expect(Array.isArray(RESOURCE_BUNDLES['mw'].collections)).toBe(true);
    expect(Array.isArray(RESOURCE_BUNDLES['mw'].files)).toBe(true);
    expect(Array.isArray(RESOURCE_BUNDLES['mw'].links)).toBe(true);
  });

  it('builds typed in-memory country manifests for each country', () => {
    expect(RESOURCE_MANIFESTS).toBeDefined();
    expect(RESOURCE_MANIFESTS['mw']).toBeDefined();
    expect(RESOURCE_MANIFESTS['zm']).toBeDefined();
    expect(RESOURCE_MANIFESTS['zw']).toBeDefined();

    const zwManifest = RESOURCE_MANIFESTS['zw'];
    expect(zwManifest.collections.length).toBe(3);
    expect(zwManifest.links.length).toBe(5);
    expect(zwManifest.files.length).toBe(0);

    const mwManifest = RESOURCE_MANIFESTS['mw'];
    expect(mwManifest.collections.length).toBe(3);
    expect(mwManifest.files.length).toBe(8);

    // Verify lookup maps
    expect(zwManifest.collectionsById['cropResources_zw']).toBeDefined();
    expect(zwManifest.collectionsById['cropResources_zw'].title).toBe('Crop, Pest & Disease');
    expect(zwManifest.linksById['accessAg_zw']).toBeDefined();
    expect(zwManifest.linksById['accessAg_zw'].subtype).toBe('website');
  });

  it('resolves bundled offline covers and remote storage paths properly', () => {
    expect(resolveCoverImage('global/resources/covers/crops.svg')).toBe('assets/resources/covers/crops.svg');
    expect(resolveCoverImage('assets/resources/covers/crops.svg')).toBe('assets/resources/covers/crops.svg');
    expect(resolveCoverImage('mw/resources/covers/custom.jpg')).toBe(
      'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/resources/covers/custom.jpg',
    );
  });

  it('resolves file urls preferring storage_file over external_url', () => {
    expect(
      resolveFileUrl({
        id: 'test',
        country_code: 'mw',
        cover_image: null,
        description: null,
        external_url: 'https://external.com/file.pdf',
        filename: 'file.pdf',
        language_code: 'mw_en',
        md5_checksum: null,
        mimetype: 'application/pdf',
        owner: null,
        size_kb: 100,
        sort_order: 1,
        storage_file: 'mw/resources/file.pdf',
        title: 'Test',
      }),
    ).toBe('https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/mw/resources/file.pdf');
  });
});
