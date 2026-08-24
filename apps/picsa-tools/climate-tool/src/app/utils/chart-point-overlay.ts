import type { ChartAPI } from 'c3';
import { select } from 'd3-selection';

import type { ILegendItem, IOverlayLine, IPointStyle, PointShape } from '../components/chart-tools/base-tool.component';

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
  const root = select<SVGGElement, unknown>(mainNode);

  if (!points || points.length === 0) {
    root.select(`g.${LAYER_CLASS}`).remove();
    root.selectAll('.c3-circles .c3-circle').style('opacity', null);
    mainNode.classList.remove(OVERLAY_ACTIVE_CLASS);
    return;
  }

  mainNode.classList.add(OVERLAY_ACTIVE_CLASS);

  // Directly set inline opacity: 0 on standard C3 circles so computedStyle in serializeSvgWithStyles sees 0
  select(mainNode).selectAll('.c3-circles .c3-circle').style('opacity', '0');

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

const LINE_LAYER_CLASS = 'picsa-line-overlay';

/**
 * Render declarative overlay lines (horizontal thresholds, tercile boundaries) directly onto chart SVG canvas.
 */
export function renderLineOverlay(chart: ChartAPI, lines: IOverlayLine[], scale = 1) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  const root = select<SVGGElement, unknown>(mainNode);
  let layer = root.select<SVGGElement>(`g.${LINE_LAYER_CLASS}`);
  if (layer.empty()) {
    layer = root.append('g').attr('class', LINE_LAYER_CLASS).attr('pointer-events', 'none');
  }

  const chartWidth = internal.width || 800;

  const lineGroups = layer
    .selectAll<SVGGElement, IOverlayLine>('g.overlay-line')
    .data(lines, (d) => d.id)
    .join((enter) => {
      const g = enter.append('g').attr('class', 'overlay-line');
      g.append('line');
      const labelGroup = g.append('g').attr('class', 'overlay-line-label');
      labelGroup.append('rect');
      labelGroup.append('text');
      return g;
    });

  lineGroups.each(function (d) {
    const g = select(this);
    const yPos = internal.y(d.value);
    const strokeColor = d.color || '#000000';
    const strokeWidth = (d.strokeWidth ?? 2) * scale;
    const dash = d.strokeDasharray || 'none';

    // Update line
    g.select('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yPos)
      .attr('y2', yPos)
      .style('stroke', strokeColor)
      .style('stroke-width', `${strokeWidth}px`)
      .style('stroke-dasharray', dash)
      .style('opacity', (d.opacity ?? 1).toString())
      .attr('stroke', strokeColor)
      .attr('stroke-width', strokeWidth)
      .attr('stroke-dasharray', dash)
      .attr('opacity', d.opacity ?? 1);

    // Update label if present
    const labelGroup = g.select<SVGGElement>('g.overlay-line-label');
    if (!d.label?.text) {
      labelGroup.style('display', 'none');
    } else {
      labelGroup.style('display', null);
      const labelText = d.label.text;
      const fontSize = (d.label.fontSize ?? 13) * scale;
      const padX = 8 * scale;
      const padY = 4 * scale;
      const textHeight = fontSize;
      const approxCharWidth = fontSize * 0.62;
      const boxWidth = labelText.length * approxCharWidth + padX * 2;
      const boxHeight = textHeight + padY * 2;

      const isRight = d.label.position === 'right';
      const boxX = isRight ? chartWidth - boxWidth - 10 : 10;
      const boxY = yPos - boxHeight - 4; // place slightly above line

      const rect = labelGroup.select('rect');
      rect
        .attr('x', boxX)
        .attr('y', boxY)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 3)
        .attr('ry', 3)
        .style('fill', d.label.background || '#ffffff')
        .style('stroke', d.label.borderColor || strokeColor)
        .style('stroke-width', '1.5px')
        .style('opacity', '0.95')
        .attr('fill', d.label.background || '#ffffff')
        .attr('stroke', d.label.borderColor || strokeColor)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.95);

      const text = labelGroup.select('text');
      text
        .attr('x', boxX + boxWidth / 2)
        .attr('y', boxY + boxHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style('fill', d.label.color || '#000000')
        .style('font-size', `${fontSize}px`)
        .style('font-family', 'sans-serif')
        .style('font-weight', '600')
        .attr('dominant-baseline', 'central')
        .attr('text-anchor', 'middle')
        .attr('fill', d.label.color || '#000000')
        .attr('font-size', `${fontSize}px`)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '600')
        .text(labelText);
    }
  });
}

export function clearLineOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;
  select(internal.main.node()).select(`g.${LINE_LAYER_CLASS}`).remove();
}

export function clearPointOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  mainNode.classList.remove(OVERLAY_ACTIVE_CLASS);

  const root = select(mainNode);
  root.select(`g.${LAYER_CLASS}`).remove();
  clearLineOverlay(chart);
  clearSvgLegend(chart);
  root.selectAll('.c3-circles .c3-circle').style('opacity', null);
}
