import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, HostListener } from '@angular/core';
import {
  EL_NINO_COLOR,
  EL_NINO_YEARS,
  ENSO_NEUTRAL_COLOR,
  LA_NINA_COLOR,
  LA_NINA_YEARS,
} from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';
import { DataPoint } from 'c3';

import { BaseChartToolComponent, ITooltipExtraRow, TOOL_SERIES_IDS } from '../base-tool.component';

@Component({
  selector: 'climate-el-nino-tool',
  templateUrl: './el-nino-tool.component.html',
  styleUrls: ['./el-nino-tool.component.scss'],
  imports: [PicsaTranslateModule, NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElNinoToolComponent extends BaseChartToolComponent {
  private elNinoSet = new Set(EL_NINO_YEARS);
  private laNinaSet = new Set(LA_NINA_YEARS);

  private elNinoLabel = 'El Niño';
  private laNinaLabel = 'La Niña';

  // Assign color variables from data
  public readonly styles = { '--el-nino-color': EL_NINO_COLOR, '--la-nina-color': LA_NINA_COLOR };

  /** Cache set of valid years with data using a computed signal */
  protected readonly validYearsWithData = computed(() => {
    const data = this.stationData();
    const chartDef = this.chartDefinition();
    if (!data || data.length === 0 || !chartDef) return new Set<number>();

    const xVar = chartDef.xVar || 'Year';
    const dataKeys = chartDef.keys || [];
    const validYears = new Set<number>();

    for (const d of data) {
      const year = d[xVar] as number;
      if (typeof year === 'number' && !isNaN(year)) {
        const hasValue = dataKeys.some((key) => {
          const val = d[key];
          return val !== null && val !== undefined && (val as any) !== '' && typeof val === 'number' && !isNaN(val);
        });

        if (hasValue) {
          validYears.add(year);
        }
      }
    }

    return validYears;
  });

  constructor() {
    super();

    // Apply custom SVG shapes whenever chart is rendered or updated
    const sub = this.chartRendered$.subscribe(() => {
      this.applyPointShapes();
    });

    // Reactively trigger shape application on configuration/data change
    effect(() => {
      const config = this.chartConfig();
      if (config) {
        setTimeout(() => this.applyPointShapes(), 100);
      }
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    setTimeout(() => this.applyPointShapes(), 50);
  }

  public override getPointColour(d: any): string | undefined {
    if (d && typeof d.x === 'number') {
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return undefined;
      const validYears = this.validYearsWithData();
      if (!validYears.has(d.x)) {
        return undefined; // Omit years without data
      }
      if (this.elNinoSet.has(d.x)) return EL_NINO_COLOR;
      if (this.laNinaSet.has(d.x)) return LA_NINA_COLOR;
      return ENSO_NEUTRAL_COLOR; // Grey out neutral years with valid data
    }
    return undefined;
  }

  // Point radius formatter: El Niño slightly larger = 12, La Niña = 8, Neutral strictly = 4
  public override getPointRadius(d: DataPoint): number | undefined {
    if (d && typeof d.x === 'number') {
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return undefined;
      const validYears = this.validYearsWithData();
      if (!validYears.has(d.x)) {
        return undefined; // Omit years without data
      }
      if (this.elNinoSet.has(d.x)) return 12;
      if (this.laNinaSet.has(d.x)) return 8;
      return 4; // Radius 4 for neutral years with valid data
    }
    return undefined;
  }

  // Tooltip pop-up row formatter (only for years with valid data)
  public override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    const validYears = this.validYearsWithData();
    if (!validYears.has(year)) {
      return undefined; // Omit years without data
    }
    if (this.elNinoSet.has(year)) {
      return { text: `▲ ${this.elNinoLabel}`, color: EL_NINO_COLOR };
    }
    if (this.laNinaSet.has(year)) {
      return { text: `■ ${this.laNinaLabel}`, color: LA_NINA_COLOR };
    }
    return undefined;
  }

  protected override onToolDestroy() {
    this.clearPointShapes();
  }

  /** Calculate current SVG pixel coordinates for point data using C3 internal scale API or DOM attributes */
  private getPointCoordinates(el: SVGElement, d: any): { cx: number; cy: number } | undefined {
    const chartApi = (this.chartService.chartComponent?.chart as any)?.internal;
    if (chartApi && typeof chartApi.x === 'function') {
      try {
        const cx = chartApi.x(d.x);
        const cy = typeof chartApi.getYValue === 'function' ? chartApi.getYValue(d) : chartApi.y(d.value);
        if (typeof cx === 'number' && !isNaN(cx) && typeof cy === 'number' && !isNaN(cy)) {
          return { cx, cy };
        }
      } catch (e) {
        // Fallback to DOM attributes
      }
    }

    let cx = 0;
    let cy = 0;

    if (el.tagName === 'circle') {
      cx = parseFloat(el.getAttribute('cx') || '0');
      cy = parseFloat(el.getAttribute('cy') || '0');
    } else if (el.tagName === 'rect') {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const w = parseFloat(el.getAttribute('width') || '0');
      cx = x + w / 2;
      cy = y + w / 2;
    } else if (el.tagName === 'polygon') {
      const origCx = el.getAttribute('data-cx');
      const origCy = el.getAttribute('data-cy');
      if (origCx && origCy) {
        cx = parseFloat(origCx);
        cy = parseFloat(origCy);
      }
    }

    if (cx || cy) {
      return { cx, cy };
    }
    return undefined;
  }

  private applyPointShapes() {
    const svg = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (!svg) return;

    const validYears = this.validYearsWithData();

    const points = svg.querySelectorAll<SVGElement>('.c3-circles .c3-circle');
    points.forEach((el: any) => {
      const d = el.__data__;
      if (!d || typeof d.x !== 'number') return;

      // Ignore points belonging to tool lines (LineTool, lowerTercile, upperTercile)
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return;

      const year = d.x;

      // Omit years without valid data for the active chart
      if (!validYears.has(year)) {
        return;
      }

      const coords = this.getPointCoordinates(el, d);
      if (!coords) return;
      const { cx, cy } = coords;

      if (this.elNinoSet.has(year)) {
        // Red/Orange Triangle (larger marker)
        const r = 12;
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute(
          'points',
          `${cx},${cy - r} ${cx - r * 0.866},${cy + r * 0.5} ${cx + r * 0.866},${cy + r * 0.5}`,
        );
        poly.setAttribute('data-cx', cx.toString());
        poly.setAttribute('data-cy', cy.toString());
        poly.setAttribute('class', 'c3-circle el-nino-point');
        poly.setAttribute(
          'style',
          `fill: ${EL_NINO_COLOR} !important; stroke: #b86b1f !important; stroke-width: 1.5px !important;`,
        );
        (poly as any).__data__ = d;
        el.parentNode?.replaceChild(poly, el);
      } else if (this.laNinaSet.has(year)) {
        // Blue Square marker
        const size = 16;
        const half = size / 2;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (cx - half).toString());
        rect.setAttribute('y', (cy - half).toString());
        rect.setAttribute('width', size.toString());
        rect.setAttribute('height', size.toString());
        rect.setAttribute('class', 'c3-circle la-nina-point');
        rect.setAttribute(
          'style',
          `fill: ${LA_NINA_COLOR} !important; stroke: #0d4277 !important; stroke-width: 1.5px !important;`,
        );
        (rect as any).__data__ = d;
        el.parentNode?.replaceChild(rect, el);
      } else {
        // Grey Circle with radius 4 and NO border
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        circle.setAttribute('r', '4');
        circle.setAttribute('class', 'c3-circle neutral-point');
        circle.setAttribute(
          'style',
          `fill: ${ENSO_NEUTRAL_COLOR} !important; stroke: none !important; opacity: 0.6 !important;`,
        );
        (circle as any).__data__ = d;
        el.parentNode?.replaceChild(circle, el);
      }
    });
  }

  private clearPointShapes() {
    const svg = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (!svg) return;

    const points = svg.querySelectorAll<SVGElement>('.c3-circles .c3-circle');
    points.forEach((el: any) => {
      const d = el.__data__;
      const coords = d ? this.getPointCoordinates(el, d) : undefined;
      const cx = coords ? coords.cx : parseFloat(el.getAttribute('cx') || '0');
      const cy = coords ? coords.cy : parseFloat(el.getAttribute('cy') || '0');

      if (cx || cy) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        circle.setAttribute('r', '8');
        circle.setAttribute('class', 'c3-circle');
        circle.removeAttribute('style');
        (circle as any).__data__ = el.__data__;
        el.parentNode?.replaceChild(circle, el);
      }
    });
  }
}
