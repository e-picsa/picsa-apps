import type { ChartAPI } from 'c3';
import { select } from 'd3-selection';

import type {
  IChartOverlayMessage,
  ILegendItem,
  IOverlayLine,
  IPointStyle,
  ITrendlineOverlay,
  PointShape,
} from '../components/chart-tools/base-tool.component';

const LAYER_CLASS = 'picsa-point-overlay';
const LEGEND_LAYER_CLASS = 'picsa-legend-overlay';
const OVERLAY_ACTIVE_CLASS = 'picsa-overlay-active';
const LINE_LAYER_CLASS = 'picsa-line-overlay';
const TRENDLINE_LAYER_CLASS = 'picsa-trendline-overlay';
const MESSAGE_LAYER_CLASS = 'picsa-message-overlay';

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
  return SHAPE_PATH[shape]?.(size) ?? SHAPE_PATH.circle(size);
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

  const gap = 16 * scale;
  const iconTextGap = 10 * scale;
  const fontSize = 13 * scale;
  const itemWidths = legendItems.map((item) =>
    Math.max(70 * scale, item.label.length * 7.5 * scale + iconTextGap + 16 * scale),
  );
  const totalWidth = itemWidths.reduce((sum, w) => sum + w, 0) + (legendItems.length - 1) * gap;
  let currentX = Math.max(20 * scale, (chartWidth - totalWidth) / 2);
  const legendY = chartHeight - 24 * scale;

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
    .style('stroke-width', (d) => `${(d.strokeWidth ?? 1) * scale}px`)
    .style('opacity', '1')
    .attr('fill', (d) => d.fill)
    .attr('stroke', (d) => d.stroke ?? 'none')
    .attr('stroke-width', (d) => (d.strokeWidth ?? 1) * scale)
    .attr('opacity', 1);

  items
    .select('text')
    .attr('x', iconTextGap)
    .attr('y', 0)
    .style('dominant-baseline', 'central')
    .style('fill', '#222222')
    .style('font-size', `${fontSize}px`)
    .style('font-family', 'sans-serif')
    .style('font-weight', '600')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#222222')
    .attr('font-size', `${fontSize}px`)
    .attr('font-family', 'sans-serif')
    .attr('font-weight', '600')
    .text((d) => d.label);
}

export function clearSvgLegend(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.svg) return;
  select(internal.svg.node()).select(`g.${LEGEND_LAYER_CLASS}`).remove();
}

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

/**
 * Render trendlines directly onto chart SVG canvas.
 * Handles single or multiple series, with dashed trendline, label badge, and optional message banner.
 */
export function renderTrendlineOverlay(
  chart: ChartAPI,
  trendlines: ITrendlineOverlay[],
  message?: IChartOverlayMessage,
  scale = 1,
) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;

  const mainNode = internal.main.node() as SVGGElement;
  const root = select<SVGGElement, unknown>(mainNode);

  // 1. Render message banner (e.g. "No strong trend detected")
  let msgLayer = root.select<SVGGElement>(`g.${MESSAGE_LAYER_CLASS}`);
  if (!message) {
    msgLayer.remove();
  } else {
    if (msgLayer.empty()) {
      msgLayer = root.append('g').attr('class', MESSAGE_LAYER_CLASS).attr('pointer-events', 'none');
    }

    const chartWidth = internal.width || 800;
    const bannerWidth = Math.min(420 * scale, chartWidth - 40 * scale);
    const bannerHeight = message.subtext ? 44 * scale : 28 * scale;
    const bannerX = (chartWidth - bannerWidth) / 2;
    const bannerY = 12 * scale;

    const bannerGroups = msgLayer.selectAll<SVGGElement, IChartOverlayMessage>('g.msg-banner').data([message]);
    const enterGroup = bannerGroups
      .enter()
      .append('g')
      .attr('class', 'msg-banner')
      .attr('transform', `translate(${bannerX}, ${bannerY})`);

    enterGroup
      .append('rect')
      .attr('width', bannerWidth)
      .attr('height', bannerHeight)
      .attr('rx', 6 * scale)
      .attr('ry', 6 * scale)
      .style('fill', '#f8fafc')
      .style('stroke', '#cbd5e1')
      .style('stroke-width', `${1.5 * scale}px`)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))')
      .attr('fill', '#f8fafc')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5 * scale);

    enterGroup
      .append('text')
      .attr('class', 'msg-main')
      .attr('x', bannerWidth / 2)
      .attr('y', message.subtext ? 16 * scale : bannerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('fill', '#334155')
      .style('font-size', `${12 * scale}px`)
      .style('font-weight', '600')
      .style('font-family', 'sans-serif')
      .attr('dominant-baseline', 'central')
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', `${12 * scale}px`)
      .attr('font-family', 'sans-serif')
      .attr('font-weight', '600')
      .text(message.text);

    if (message.subtext) {
      enterGroup
        .append('text')
        .attr('class', 'msg-sub')
        .attr('x', bannerWidth / 2)
        .attr('y', 30 * scale)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .style('fill', '#64748b')
        .style('font-size', `${10.5 * scale}px`)
        .style('font-weight', '500')
        .style('font-family', 'sans-serif')
        .attr('dominant-baseline', 'central')
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', `${10.5 * scale}px`)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '500')
        .text(message.subtext);
    }

    bannerGroups
      .attr('transform', `translate(${bannerX}, ${bannerY})`)
      .select('rect')
      .attr('width', bannerWidth)
      .attr('height', bannerHeight);
    bannerGroups.select('text.msg-main').text(message.text);
    bannerGroups.select('text.msg-sub').text(message.subtext || '');
    bannerGroups.exit().remove();
  }

  // 2. Render trendlines
  let layer = root.select<SVGGElement>(`g.${TRENDLINE_LAYER_CLASS}`);
  if (!trendlines || trendlines.length === 0) {
    layer.remove();
    return;
  }

  if (layer.empty()) {
    layer = root.append('g').attr('class', TRENDLINE_LAYER_CLASS).attr('pointer-events', 'none');
  }

  const lineGroups = layer
    .selectAll<SVGGElement, ITrendlineOverlay>('g.trendline-item')
    .data(trendlines, (d) => d.id)
    .join((enter) => {
      const g = enter.append('g').attr('class', 'trendline-item');
      g.append('line');
      const labelGroup = g.append('g').attr('class', 'trendline-label');
      labelGroup.append('rect');
      labelGroup.append('text');
      return g;
    });

  const chartHeight = internal.height || 400;

  lineGroups.each(function (d) {
    const g = select(this);
    const strokeColor = d.color || '#333333';
    const strokeWidth = (d.strokeWidth ?? 2.5) * scale;
    const strokeDash = d.strokeDasharray || '6 4';

    const x1 = internal.x(d.startX);
    const x2 = internal.x(d.endX);
    const yScale = d.seriesKey ? internal.getYScale(d.seriesKey) : internal.y;
    const y1 = yScale(d.startY);
    const y2 = yScale(d.endY);

    g.select('line')
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2)
      .style('stroke', strokeColor)
      .style('stroke-width', `${strokeWidth}px`)
      .style('stroke-dasharray', strokeDash)
      .attr('stroke', strokeColor)
      .attr('stroke-width', strokeWidth)
      .attr('stroke-dasharray', strokeDash);

    // Label badge placed near the right end of the trendline
    const labelGroup = g.select<SVGGElement>('g.trendline-label');
    if (!d.label) {
      labelGroup.style('display', 'none');
    } else {
      labelGroup.style('display', null);
      const lines = d.label.split('\n');
      const fontSize = 13.5 * scale;
      const subFontSize = 11.5 * scale;
      const lineHeight = fontSize * 1.25;
      const padX = 8 * scale;
      const padY = 5 * scale;

      const maxChars = Math.max(...lines.map((l) => l.length));
      const boxWidth = maxChars * (fontSize * 0.62) + padX * 2;
      const boxHeight =
        lines.length === 1 ? fontSize + padY * 2 : fontSize + (lines.length - 1) * lineHeight + padY * 2;

      // Position badge just to the right of line end, clamped within chart bounds
      const badgeX = Math.max(10, x2 - boxWidth);
      const rawBadgeY = y2 - boxHeight - 4 * scale;
      const badgeY = Math.max(2, Math.min(chartHeight - boxHeight - 2, rawBadgeY));

      labelGroup
        .select('rect')
        .attr('x', badgeX)
        .attr('y', badgeY)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 4 * scale)
        .attr('ry', 4 * scale)
        .style('fill', '#ffffff')
        .style('stroke', strokeColor)
        .style('stroke-width', `${1.5 * scale}px`)
        .style('opacity', '0.94')
        .attr('fill', '#ffffff')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.5 * scale)
        .attr('opacity', 0.94);

      const textElem = labelGroup
        .select('text')
        .attr('x', badgeX + boxWidth / 2)
        .attr('y', badgeY + padY + fontSize * 0.75)
        .attr('text-anchor', 'middle')
        .style('fill', strokeColor)
        .style('font-family', 'sans-serif')
        .attr('text-anchor', 'middle')
        .attr('fill', strokeColor)
        .attr('font-family', 'sans-serif')
        .text(null);

      textElem
        .selectAll('tspan')
        .data(lines)
        .join('tspan')
        .attr('x', badgeX + boxWidth / 2)
        .attr('dy', (_, i) => (i === 0 ? 0 : lineHeight))
        .attr('font-size', (_, i) => `${i === 0 ? fontSize : subFontSize}px`)
        .attr('font-weight', (_, i) => (i === 0 ? '700' : '600'))
        .style('font-size', (_, i) => `${i === 0 ? fontSize : subFontSize}px`)
        .style('font-weight', (_, i) => (i === 0 ? '700' : '600'))
        .text((line) => line);
    }
  });
}

export function clearTrendlineOverlay(chart?: ChartAPI) {
  const internal = (chart as any)?.internal;
  if (!internal?.main) return;
  select(internal.main.node()).select(`g.${TRENDLINE_LAYER_CLASS}`).remove();
  select(internal.main.node()).select(`g.${MESSAGE_LAYER_CLASS}`).remove();
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
  clearTrendlineOverlay(chart);
  root.selectAll('.c3-circles .c3-circle').style('opacity', null);
}
