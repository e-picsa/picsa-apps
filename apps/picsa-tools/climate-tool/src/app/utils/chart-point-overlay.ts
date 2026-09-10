  const chartWidth = internal.currentWidth || 900;
  const chartHeight = internal.currentHeight || 530;

  const gap = 16 * scale;
  const iconTextGap = 10 * scale;
  const fontSize = 13 * scale;
  const itemWidths = legendItems.map((item) => Math.max(70 * scale, item.label.length * 7.5 * scale + iconTextGap + 16 * scale));
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