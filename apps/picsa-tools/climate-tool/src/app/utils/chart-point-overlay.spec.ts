import type { ChartAPI } from 'c3';

import type { IChartOverlayMessage, ITrendlineOverlay } from '../components/chart-tools/base-tool.component';
import { clearPointOverlay, clearTrendlineOverlay, renderTrendlineOverlay } from './chart-point-overlay';

describe('chart-point-overlay', () => {
  let container: HTMLDivElement;
  let svg: SVGSVGElement;
  let mainG: SVGGElement;
  let mockChart: ChartAPI;

  beforeEach(() => {
    container = document.createElement('div');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(mainG);
    container.appendChild(svg);
    document.body.appendChild(container);

    mockChart = {
      internal: {
        svg: { node: () => svg },
        main: { node: () => mainG },
        x: (x: number) => (x - 2000) * 50,
        y: (y: number) => 400 - y * 2,
        getYScale: () => (y: number) => 400 - y * 2,
        width: 800,
        height: 400,
        currentWidth: 800,
        currentHeight: 500,
      },
    } as unknown as ChartAPI;
  });

  afterEach(() => {
    container.remove();
  });

  it('should render trendline and label badge on SVG', () => {
    const trendlines: ITrendlineOverlay[] = [
      {
        id: 'trendline-rain',
        startX: 2000,
        endX: 2010,
        startY: 50,
        endY: 100,
        color: '#13599e',
        label: '+50mm/10y',
      },
    ];

    renderTrendlineOverlay(mockChart, trendlines);

    const layer = mainG.querySelector('g.picsa-trendline-overlay');
    expect(layer).toBeTruthy();

    const line = layer?.querySelector('line');
    expect(line).toBeTruthy();
    expect(line?.getAttribute('x1')).toBe('0');
    expect(line?.getAttribute('x2')).toBe('500');
    expect(line?.getAttribute('stroke')).toBe('#13599e');

    const badge = layer?.querySelector('g.trendline-label');
    expect(badge).toBeTruthy();
    const text = badge?.querySelector('text');
    expect(text?.textContent).toBe('+50mm/10y');
  });

  it('should clamp trendline label badge position so it remains within chart bounds', () => {
    // startY and endY which map to extreme y positions
    const trendlines: ITrendlineOverlay[] = [
      {
        id: 'trendline-clamped-top',
        startX: 2000,
        endX: 2010,
        startY: 250,
        endY: 250, // y will be 400 - 500 = -100 (above chart area)
        color: '#13599e',
        label: '+Top',
      },
    ];

    renderTrendlineOverlay(mockChart, trendlines);

    const layer = mainG.querySelector('g.picsa-trendline-overlay');
    const badgeRect = layer?.querySelector('rect');
    expect(badgeRect).toBeTruthy();

    const y = parseFloat(badgeRect?.getAttribute('y') || '0');
    // Clamped so it doesn't render off-canvas above the chart
    expect(y).toBeGreaterThanOrEqual(2);
  });

  it('should render message banner when provided', () => {
    const message: IChartOverlayMessage = {
      text: 'No strong trend detected',
      subtext: '|r| = 0.12, p = 0.450',
    };

    renderTrendlineOverlay(mockChart, [], message);

    const msgLayer = mainG.querySelector('g.picsa-message-overlay');
    expect(msgLayer).toBeTruthy();
    const mainText = msgLayer?.querySelector('text.msg-main');
    expect(mainText?.textContent).toBe('No strong trend detected');
    const subText = msgLayer?.querySelector('text.msg-sub');
    expect(subText?.textContent).toBe('|r| = 0.12, p = 0.450');
  });

  it('should remove trendline and message overlay on clearTrendlineOverlay and clearPointOverlay', () => {
    renderTrendlineOverlay(
      mockChart,
      [
        {
          id: 'line1',
          startX: 2000,
          endX: 2005,
          startY: 10,
          endY: 20,
          color: '#ff0000',
        },
      ],
      { text: 'Test' },
    );

    expect(mainG.querySelector('g.picsa-trendline-overlay')).toBeTruthy();
    expect(mainG.querySelector('g.picsa-message-overlay')).toBeTruthy();

    clearTrendlineOverlay(mockChart);

    expect(mainG.querySelector('g.picsa-trendline-overlay')).toBeFalsy();
    expect(mainG.querySelector('g.picsa-message-overlay')).toBeFalsy();

    // Re-render and test clearPointOverlay
    renderTrendlineOverlay(mockChart, [
      {
        id: 'line2',
        startX: 2000,
        endX: 2005,
        startY: 10,
        endY: 20,
        color: '#ff0000',
      },
    ]);
    expect(mainG.querySelector('g.picsa-trendline-overlay')).toBeTruthy();

    clearPointOverlay(mockChart);
    expect(mainG.querySelector('g.picsa-trendline-overlay')).toBeFalsy();
  });
});
