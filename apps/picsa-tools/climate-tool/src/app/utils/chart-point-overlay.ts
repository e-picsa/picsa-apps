import type { ChartAPI } from 'c3';
import { select } from 'd3-selection';

import type { ILegendItem, IPointStyle, PointShape } from '../components/chart-tools/base-tool.component';

const LAYER_CLASS = 'picsa-point-overlay';
const LEGEND_LAYER_CLASS = 'picsa-legend-overlay';
const OVERLAY_ACTIVE_CLASS = 'picsa-overlay-active';

const SHAPE_PATH: Record<PointShape, (s: number) => string> = {
  circle: (s) => `M ${-s},0 a ${s},${s} 0 1,0 ${2 * s},0 a ${s},${s} 0 1,0 ${-2 * s},0`,
  square: (s) => `M ${-s},${-s} h ${2 * s} v ${2 * s} h ${-2 * s} Z`,
  triangle: (s) => `M 0,${-s} L ${s * 0.866},${s * 0.5} L ${-s * 0.866},${s * 0.5} Z`,
  diamond: (s) => `M 0,${-s} L ${s},0 L 0,${s} L ${-s},0 Z`,
};

export interface IOverlayPoint {
  /** series key, used to resolve the correct y axis (y or y2) */
  id: string;
  x: number;
  value: number;
  style: IPointStyle;
}

/** Path string for a shape, exposed so legends can share marker geometry */
export function getShapePath(shape: PointShape, size: number): string {
  return SHAPE_PATH[shape](size);
}

/**
 * Render custom point markers into a dedicated layer inside the chart's main group.
 *
 * Uses a keyed data join so repeat calls are idempotent and cheap - safe to run on
 * every `onrendered`. The layer is pointer-events:none so C3's own (hidden) circles
 * retain tooltip hit targets.
 *
 * Paint properties are set as inline CSS styles so they override C3's `.c3 path` default rules
 * and are captured correctly by SVG->PNG export.
 */
export function renderPointOverlay(chart: ChartAPI, points: IOverlayPoint[], scale = 1) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  mainNode.classList.add(OVERLAY_ACTIVE_CLASS);

  // Directly set inline opacity: 0 on standard C3 circles so computedStyle in serializeSvgWithStyles sees 0
  select(mainNode).selectAll('.c3-circles .c3-circle').style('opacity', '0');

  const root = select<SVGGElement, unknown>(mainNode);
  let layer = root.select<SVGGElement>(`g.${LAYER_CLASS}`);
  if (layer.empty()) {
    layer = root.append('g').attr('class', LAYER_CLASS).attr('pointer-events', 'none');
  }

  layer
    .selectAll<SVGPathElement, IOverlayPoint>('path')
    .data(points, (d) => `${d.id}:${d.x}`)
    .join('path')
    .attr('d', (d) => getShapePath(d.style.shape, d.style.size * scale))
    .attr('transform', (d) => `translate(${internal.x(d.x)},${internal.getYScale(d.id)(d.value)})`)
    .style('fill', (d) => d.style.fill)
    .style('stroke', (d) => d.style.stroke ?? 'none')
    .style('stroke-width', (d) => `${(d.style.strokeWidth ?? 0) * scale}px`)
    .style('opacity', (d) => (d.style.opacity ?? 1).toString())
    .attr('fill', (d) => d.style.fill)
    .attr('stroke', (d) => d.style.stroke ?? 'none')
    .attr('stroke-width', (d) => (d.style.strokeWidth ?? 0) * scale)
    .attr('opacity', (d) => d.style.opacity ?? 1);
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
  if (!internal?.svg || !legendItems?.length) return;

  const svgNode = internal.svg.node() as SVGSVGElement;
  const root = select<SVGSVGElement, unknown>(svgNode);

  let legendLayer = root.select<SVGGElement>(`g.${LEGEND_LAYER_CLASS}`);
  if (legendLayer.empty()) {
    legendLayer = root.append('g').attr('class', LEGEND_LAYER_CLASS);
  }

  const chartWidth = internal.currentWidth || 900;
  const chartHeight = internal.currentHeight || 530;

  const itemGap = 48;
  const iconTextGap = 12;
  const approxItemWidth = 90;
  const totalWidth = legendItems.length * approxItemWidth + (legendItems.length - 1) * itemGap;
  let currentX = Math.max(40, (chartWidth - totalWidth) / 2);
  const legendY = chartHeight - 24;

  const data: ISvgLegendItem[] = legendItems.map((item) => {
    const x = currentX;
    currentX += approxItemWidth + itemGap;
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
    .attr('d', (d) => getShapePath(d.shape, 6))
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
  select(internal.svg.node()).select(`g.${LEGEND_LAYER_CLASS}`).remove();
}

export function clearPointOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  mainNode.classList.remove(OVERLAY_ACTIVE_CLASS);

  const root = select(mainNode);
  root.select(`g.${LAYER_CLASS}`).remove();
  clearSvgLegend(chart);
  root.selectAll('.c3-circles .c3-circle').style('opacity', null);
}
