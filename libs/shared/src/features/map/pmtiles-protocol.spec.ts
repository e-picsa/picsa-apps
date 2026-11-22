jest.mock('maplibre-gl', () => ({ addProtocol: jest.fn() }));

import { AssetPmtilesSource } from './pmtiles-protocol';

describe('AssetPmtilesSource', () => {
  const bytesFrom = (values: number[]) => new Uint8Array(values).buffer;

  afterEach(() => {
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  it('returns exact-length 206 responses directly without extra slicing', async () => {
    const payload = bytesFrom([10, 20, 30, 40]);
    (globalThis as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      status: 206,
      headers: new Headers({ ETag: '"abc"' }),
      arrayBuffer: async () => payload,
    });

    const source = new AssetPmtilesSource('assets/mapTiles/mw.pmtiles');
    const res = await source.getBytes(100, 4);

    expect(new Uint8Array(res.data)).toEqual(new Uint8Array([10, 20, 30, 40]));
    expect(res.etag).toBe('"abc"');
  });

  it('slices oversized 206 offset-to-EOF responses and caches offset-0 whole-archive reads', async () => {
    // Simulates WebViewAssetLoader returning bytes [offset..EOF] while ignoring the Range end byte
    const offsetToEof = bytesFrom([1, 2, 3, 4, 5, 6, 7, 8]);
    const fetchMock = jest.fn().mockResolvedValue({
      status: 206,
      headers: new Headers(),
      arrayBuffer: async () => offsetToEof,
    });
    (globalThis as { fetch: unknown }).fetch = fetchMock;

    const source = new AssetPmtilesSource('assets/mapTiles/global-base.pmtiles');
    const first = await source.getBytes(0, 3);
    const second = await source.getBytes(4, 3);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Uint8Array(first.data)).toEqual(new Uint8Array([1, 2, 3]));
    expect(new Uint8Array(second.data)).toEqual(new Uint8Array([5, 6, 7]));
  });

  it('falls back to fetch when an unverified oversized offset-0 206 response did not reach a later offset', async () => {
    const partialPrefix = bytesFrom([1, 2, 3, 4, 5]);
    const laterSlice = bytesFrom([10, 11, 12]);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        status: 206,
        headers: new Headers(),
        arrayBuffer: async () => partialPrefix,
      })
      .mockResolvedValueOnce({
        status: 206,
        headers: new Headers(),
        arrayBuffer: async () => laterSlice,
      });
    (globalThis as { fetch: unknown }).fetch = fetchMock;

    const source = new AssetPmtilesSource('assets/mapTiles/mw.pmtiles');
    const first = await source.getBytes(0, 3);
    const second = await source.getBytes(10, 3);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new Uint8Array(first.data)).toEqual(new Uint8Array([1, 2, 3]));
    expect(new Uint8Array(second.data)).toEqual(new Uint8Array([10, 11, 12]));
  });

  it('rejects truncated 206 responses for non-zero offsets', async () => {
    (globalThis as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      status: 206,
      headers: new Headers(),
      arrayBuffer: async () => bytesFrom([1, 2]),
    });

    const source = new AssetPmtilesSource('assets/mapTiles/zm.pmtiles');
    await expect(source.getBytes(50, 8)).rejects.toThrow('truncated 206 response');
  });

  it('caches full buffer once and slices locally when server ignores Range with HTTP 200', async () => {
    const fullArchive = bytesFrom([100, 101, 102, 103, 104, 105]);
    const fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      headers: new Headers(),
      arrayBuffer: async () => fullArchive,
    });
    (globalThis as { fetch: unknown }).fetch = fetchMock;

    const source = new AssetPmtilesSource('assets/mapTiles/zw.pmtiles');
    const first = await source.getBytes(1, 2);
    const second = await source.getBytes(3, 3);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Uint8Array(first.data)).toEqual(new Uint8Array([101, 102]));
    expect(new Uint8Array(second.data)).toEqual(new Uint8Array([103, 104, 105]));
  });
});
