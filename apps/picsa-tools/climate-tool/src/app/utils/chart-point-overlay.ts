import type { ChartAPI } from 'c3';
import { select } from 'd3-selection';

import type { ILegendItem, IOverlayLine, IOverlayPoint, PointShape } from '../components/chart-tools/base-tool.component';

const OVERLAY_LAYER_CLASS = 'chart-custom-point-overlay';
const LINE_OVERLAY_LAYER_CLASS = 'chart-custom-line-overlay';
const LEGEND_LAYER_CLASS = 'chart-custom-svg-legend';

/**
 * Return an SVG path string centered at (0, 0) for the given shape and size (radius).
 */
export function getShapePath(shape: PointShape, size: number): string {
  switch (shape) {
    case 'triangle': {
      // Equilateral triangle pointing up: top vertex, bottom-right, bottom-left
      const h = size * 1.6;
      const top = -h * (2 / 3);
      const bottom = h * (1 / 3);
      const halfW = (h / Math.sqrt(3)) * 1.1;
      return `M 0,${top.toFixed(2)} L ${halfW.toFixed(2)},${bottom.toFixed(2)} L ${(-halfW).toFixed(2)},${bottom.toFixed(2)} Z`;
    }
    case 'square': {
      // Centered square of side length 2 * size
      const s = size * 0.9;
      return `M ${-s},${-s} L ${s},${-s} L ${s},${s} L ${-s},${s} Z`;
    }
    case 'diamond': {
      // 4-point diamond
      const d = size * 1.2;
      return `M 0,${-d} L ${d},0 L 0,${d} L ${-d},0 Z`;
    }
    case 'cross': {
      const arm = size * 1.1;
      const t = arm * 0.35;
      return `M ${-t},${-arm} L ${t},${-arm} L ${t},${-t} L ${arm},${-t} L ${arm},${t} L ${t},${t} L ${t},${arm} L ${-t},${arm} L ${-t},${t} L ${-arm},${t} L ${-arm},${-t} L ${-t},${-t} Z`;
    }
    case 'circle':
    default: {
      // Approximate circle using 4 cubic bezier curves (r = size)
      const r = size;
      const c = r * 0.5522847498;
      return `M 0,${-r} C ${c},${-r} ${r},${-c} ${r},0 C ${r},${c} ${c},${r} 0,${r} C ${-c},${r} ${-r},${c} ${-r},0 C ${-r},${-c} ${-c},${-r} 0,${-r} Z`;
    }
  }
}

interface ISvgLegendItem extends ILegendItem {
  x: number;
  y: number;
}

/**
 * Render a declarative tool legend directly onto the SVG canvas.
 * Renders below the plot area so it is captured directly by SVG->PNG export without requiring HTML elements.
 */
export function renderSvgLegend(chart: ChartAPI, legendItems: ILegendItem[], scale = 1) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;

  if (!legendItems?.length) {
    clearSvgLegend(chart);
    return;
  }

  const svgNode = internal.svg.node() as SVGSVGElement;
  const root = select<SVGSVGElement, unknown>(svgNode);

  let legendLayer = root.select<SVGGElement>(`g.${LEGEND_LAYER_CLASS}`);
  if (legendLayer.empty()) {
    legendLayer = root.append('g').attr('class', LEGEND_LAYER_CLASS);
  }

  const chartWidth = internal.currentWidth || 900;
  const chartHeight = internal.currentHeight || 530;

  const gap = 16;
  const iconTextGap = 10;
  // Dynamic item width estimation based on label length to prevent overlap
  const itemWidths = legendItems.map((item) => Math.max(70, item.label.length * 7.5 + iconTextGap + 16));
  const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0) + (legendItems.length - 1) * gap;
  let currentX = Math.max(20, (chartWidth - totalWidth) / 2);
  const legendY = chartHeight - 24;

  const data: ISvgLegendItem[] = legendItems.map((item, idx) => {
    const x = currentX;
    currentX += itemWidths[idx] + gap;
    return { ...item, x, y: legendY };
  });

  const items = legendLayer
    .selectAll<SVGGElement, ISvgLegendItem>('g.legend-item')
    .data(data, (d) => d.label)
    .join((enter) => {
      const g = enter.append('g').attr('class', 'legend-item');
      g.append('path');
      g.append('text');
      return g;
    });

  items.attr('transform', (d) => `translate(${d.x},${d.y})`);

  items
    .select('path')
    .attr('d', (d) => getShapePath(d.shape, (d.size ? Math.min(d.size * 0.8, 10) : 6) * scale))
    .style('fill', (d) => d.fill)
    .style('stroke', (d) => d.stroke ?? 'none')
    .style('stroke-width', (d) => `${d.strokeWidth ?? 1}px`)
    .style('opacity', '1')
    .attr('fill', (d) => d.fill)
    .attr('stroke', (d) => d.stroke ?? 'none')
    .attr('stroke-width', (d) => d.strokeWidth ?? 1)
    .attr('opacity', '1');

  items
    .select('text')
    .attr('x', iconTextGap)
    .attr('y', 0)
    .style('dominant-baseline', 'central')
    .style('fill', '#222222')
    .style('font-size', '13px')
    .style('font-family', 'sans-serif')
    .style('font-weight', '600')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#222222')
    .attr('font-size', '13px')
    .attr('font-family', 'sans-serif')
    .attr('font-weight', '600')
    .text((d) => d.label);
}

export function clearSvgLegend(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;
  const svgNode = internal.svg.node() as SVGSVGElement;
  select(svgNode).select(`g.${LEGEND_LAYER_CLASS}`).remove();
}

/**
 * Render custom SVG shapes on top of C3 chart points.
 */
export function renderPointOverlay(chart: ChartAPI, points: IOverlayPoint[], scale = 1) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;

  const svgNode = internal.svg.node() as SVGSVGElement;
  const root = select<SVGSVGElement, unknown>(svgNode);

  let overlay = root.select<SVGGElement>(`g.${OVERLAY_LAYER_CLASS}`);
  if (overlay.empty()) {
    const main = root.select('g.c3-chart');
    overlay = !main.empty()
      ? (main.append('g').attr('class', OVERLAY_LAYER_CLASS) as any)
      : root.append('g').attr('class', OVERLAY_LAYER_CLASS);
  }

  const resolved = points
    .map((p) => {
      let cx: number | undefined;
      let cy: number | undefined;
      try {
        cx = internal.x(p.x);
        cy = internal.getYForX ? internal.getYForX(p.value, p.id) : internal.y(p.value);
      } catch {
        // Fallback or chart not fully sized
      }
      return { ...p, cx, cy };
    })
    .filter((p): p is typeof p & { cx: number; cy: number } => p.cx !== undefined && p.cy !== undefined);

  const shapes = overlay
    .selectAll<SVGPathElement, (typeof resolved)[0]>('path.overlay-point')
    .data(resolved, (d) => `${d.id}-${d.x}`);

  shapes.join(
    (enter) =>
      enter
        .append('path')
        .attr('class', 'overlay-point')
        .attr('transform', (d) => `translate(${d.cx},${d.cy})`)
        .attr('d', (d) => getShapePath(d.style.shape, d.style.size * scale))
        .style('fill', (d) => d.style.fill)
        .style('stroke', (d) => d.style.stroke ?? 'none')
        .style('stroke-width', (d) => `${d.style.strokeWidth ?? 1}px`)
        .style('opacity', (d) => String(d.style.opacity ?? 1))
        .style('pointer-events', 'none'),
    (update) =>
      update
        .attr('transform', (d) => `translate(${d.cx},${d.cy})`)
        .attr('d', (d) => getShapePath(d.style.shape, d.style.size * scale))
        .style('fill', (d) => d.style.fill)
        .style('stroke', (d) => d.style.stroke ?? 'none')
        .style('stroke-width', (d) => `${d.style.strokeWidth ?? 1}px`)
        .style('opacity', (d) => String(d.style.opacity ?? 1)),
    (exit) => exit.remove()
  );
}

export function clearPointOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;
  const svgNode = internal.svg.node() as SVGSVGElement;
  select(svgNode).select(`g.${OVERLAY_LAYER_CLASS}`).remove();
}

/**
 * Render custom horizontal lines across the chart area.
 */
export function renderLineOverlay(chart: ChartAPI, lines: IOverlayLine[], scale = 1) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;

  const svgNode = internal.svg.node() as SVGSVGElement;
  const root = select<SVGSVGElement, unknown>(svgNode);

  let overlay = root.select<SVGGElement>(`g.${LINE_OVERLAY_LAYER_CLASS}`);
  if (overlay.empty()) {
    const main = root.select('g.c3-chart');
    overlay = !main.empty()
      ? (main.append('g').attr('class', LINE_OVERLAY_LAYER_CLASS) as any)
      : root.append('g').attr('class', LINE_OVERLAY_LAYER_CLASS);
  }

  const xMin = internal.x.range()[0] ?? 0;
  const xMax = internal.x.range()[1] ?? internal.width;

  const resolved = lines
    .map((line) => {
      let y: number | undefined;
      try {
        y = internal.y(line.value);
      } catch {
        // Fallback
      }
      return { ...line, y, xMin, xMax };
    })
    .filter((l): l is typeof l & { y: number } => l.y !== undefined);

  const groups = overlay
    .selectAll<SVGGElement, (typeof resolved)[0]>('g.overlay-line-group')
    .data(resolved, (d) => d.id ?? String(d.value));

  const enter = groups
    .join((e) => {
      const g = e.append('g').attr('class', 'overlay-line-group');
      g.append('line');
      g.append('text');
      return g;
    });

  enter.select('line')
    .attr('x1', (d) => d.xMin)
    .attr('x2', (d) => d.xMax)
    .attr('y1', (d) => d.y)
    .attr('y2', (d) => d.y)
    .style('stroke', (d) => d.color)
    .style('stroke-width', (d) => `${(d.strokeWidth ?? 2) * scale}px`)
    .style('stroke-dasharray', (d) => d.dashArray ?? 'none')
    .style('pointer-events', 'none');

  enter.select('text')
    .attr('x', (d) => d.xMax - 6)
    .attr('y', (d) => d.y - 4)
    .attr('text-anchor', 'end')
    .style('fill', (d) => d.color)
    .style('font-size', `${Math.max(10, 11 * scale)}px`)
    .style('font-family', 'sans-serif')
    .style('font-weight', '600')
    .style('pointer-events', 'none')
    .text((d) => d.label ?? '');
}

export function clearLineOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;
  const svgNode = internal.svg.node() as SVGSVGElement;
  select(svgNode).select(`g.${LINE_OVERLAY_LAYER_CLASS}`).remove();
}
