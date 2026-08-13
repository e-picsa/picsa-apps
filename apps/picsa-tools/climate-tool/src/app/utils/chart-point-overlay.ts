import type { ChartAPI } from 'c3';
import { select } from 'd3-selection';

import type { IPointStyle, PointShape } from '../components/chart-tools/base-tool.component';

const LAYER_CLASS = 'picsa-point-overlay';
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

export function clearPointOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  mainNode.classList.remove(OVERLAY_ACTIVE_CLASS);

  select(mainNode).select(`g.${LAYER_CLASS}`).remove();
}
