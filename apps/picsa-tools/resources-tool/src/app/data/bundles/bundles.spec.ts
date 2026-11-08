import { RESOURCE_BUNDLES } from './index';

describe('RESOURCE_BUNDLES', () => {
  it('exports country bundles with collections, files, and links', () => {
    expect(RESOURCE_BUNDLES).toBeDefined();
    expect(RESOURCE_BUNDLES['mw']).toBeDefined();
    expect(RESOURCE_BUNDLES['zm']).toBeDefined();

    expect(Array.isArray(RESOURCE_BUNDLES['mw'].collections)).toBe(true);
    expect(Array.isArray(RESOURCE_BUNDLES['mw'].files)).toBe(true);
    expect(Array.isArray(RESOURCE_BUNDLES['mw'].links)).toBe(true);
  });
});
