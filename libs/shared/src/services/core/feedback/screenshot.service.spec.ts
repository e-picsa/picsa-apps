import html2canvas from 'html2canvas-pro';

import { normalizeInlineSvgTransforms, parseDataUri, rasterizeSvgImages, renderPageToPng } from './screenshot.service';

jest.mock('html2canvas-pro', () => ({
  __esModule: true,
  default: jest.fn(),
}));

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

describe('renderPageToPng', () => {
  const html2canvasMock = html2canvas as jest.MockedFunction<typeof html2canvas>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="capture-fixture">
        <img src="/assets/svgs/crop.svg" alt="crop" />
        <span class="material-icons">chevron_right</span>
        <canvas width="16" height="16"></canvas>
      </div>
    `;
    html2canvasMock.mockReset();
  });

  it('captures the full-page fixture with external-content-safe renderer options', async () => {
    const canvas = document.createElement('canvas');
    const toDataURL = jest.fn().mockReturnValue('data:image/png;base64,captured');
    Object.defineProperty(canvas, 'toDataURL', { value: toDataURL });
    html2canvasMock.mockResolvedValue(canvas);

    await expect(renderPageToPng()).resolves.toBe('data:image/png;base64,captured');

    const width = Math.max(document.body.scrollWidth, window.innerWidth);
    const height = Math.max(document.body.scrollHeight, window.innerHeight);
    expect(html2canvasMock).toHaveBeenCalledWith(
      document.body,
      expect.objectContaining({
        allowTaint: false,
        backgroundColor: null,
        height,
        logging: false,
        scale: 1,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        width,
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
      }),
    );
    expect(toDataURL).toHaveBeenCalledWith('image/png');
  });
});

describe('rasterizeSvgImages', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rasterizes external svg images and restores original sources', async () => {
    document.body.innerHTML = `
      <img id="svg-img" src="/assets/svgs/crop.svg" alt="crop" />
      <img id="png-img" src="/assets/images/photo.png" alt="photo" />
    `;
    const svgImg = document.getElementById('svg-img') as HTMLImageElement;
    const pngImg = document.getElementById('png-img') as HTMLImageElement;
    Object.defineProperty(svgImg, 'complete', { value: true, configurable: true });
    Object.defineProperty(svgImg, 'clientWidth', { value: 40, configurable: true });
    Object.defineProperty(svgImg, 'clientHeight', { value: 40, configurable: true });

    const drawImage = jest.fn();
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,rasterized');

    const restore = await rasterizeSvgImages();

    expect(drawImage).toHaveBeenCalledWith(svgImg, 0, 0, 40, 40);
    expect(svgImg.getAttribute('src')).toBe('data:image/png;base64,rasterized');
    expect(pngImg.getAttribute('src')).toBe('/assets/images/photo.png');

    restore();
    expect(svgImg.getAttribute('src')).toContain('/assets/svgs/crop.svg');
  });
});

describe('normalizeInlineSvgTransforms', () => {
  it('moves a pure translation to margins and restores afterwards', () => {
    document.body.innerHTML = `<svg id="moved-svg" style="position: absolute; transform: matrix(1, 0, 0, 1, -12, -12)"></svg>`;
    const svg = document.getElementById('moved-svg') as SVGElement;
    const getComputedStyleMock = jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      transform: 'matrix(1, 0, 0, 1, -12, -12)',
      position: 'absolute',
    } as CSSStyleDeclaration);
    const globalAny = globalThis as { DOMMatrixReadOnly?: unknown };
    globalAny.DOMMatrixReadOnly = class {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = -12;
      f = -12;
    };

    const restore = normalizeInlineSvgTransforms();
    expect(svg.style.transform).toBe('none');
    // jsdom serializes the unitless zeros in the margin shorthand as `0px`.
    expect(svg.style.margin).toBe('-12px 0px 0px -12px');

    restore();
    expect(svg.style.transform).toBe('matrix(1, 0, 0, 1, -12, -12)');
    expect(svg.style.margin).toBe('');

    getComputedStyleMock.mockRestore();
    delete globalAny.DOMMatrixReadOnly;
  });
});
