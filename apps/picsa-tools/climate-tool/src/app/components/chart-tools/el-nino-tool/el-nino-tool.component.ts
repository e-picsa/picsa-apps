import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import {
  EL_NINO_COLOR,
  EL_NINO_YEARS,
  LA_NINA_COLOR,
  LA_NINA_YEARS,
  NEUTRAL_COLOR,
} from '@picsa/data/climate/tool_definitions';
import { PicsaTranslateModule } from '@picsa/i18n';

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

  protected override getPointColour(d: any): string | undefined {
    if (d && typeof d.x === 'number') {
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return undefined;
      const validYears = this.getValidYearsWithData();
      if (!validYears.has(d.x)) {
        return undefined; // Omit years without data
      }
      if (this.elNinoSet.has(d.x)) return EL_NINO_COLOR;
      if (this.laNinaSet.has(d.x)) return LA_NINA_COLOR;
      return NEUTRAL_COLOR; // Grey out neutral years with valid data
    }
    return undefined;
  }

  // Point radius formatter: El Niño slightly larger = 12, La Niña = 8, Neutral strictly = 4
  protected override getPointRadius(d: any): number | undefined {
    if (d && typeof d.x === 'number') {
      if (d.id && TOOL_SERIES_IDS.includes(d.id)) return undefined;
      const validYears = this.getValidYearsWithData();
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
  protected override formatTooltipRow(year: number): ITooltipExtraRow | undefined {
    const validYears = this.getValidYearsWithData();
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

  /**
   * Return a Set of years that have valid, non-null numeric data values for the current chart.
   */
  private getValidYearsWithData(): Set<number> {
    const data = this.stationData();
    const chartDef = this.chartDefinition();
    if (!data || data.length === 0 || !chartDef) return new Set();

    const xVar = chartDef.xVar || 'Year';
    const dataKeys = chartDef.keys || [];

    const validYears = new Set<number>();

    for (const d of data) {
      const year = d[xVar] as number;
      if (typeof year === 'number' && !isNaN(year)) {
        // Check if at least one key has a valid numeric value (not null, undefined, NaN, or "")
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
  }

  private applyPointShapes() {
    const svg = document.querySelector<SVGSVGElement>('#picsa_chart_svg');
    if (!svg) return;

    const validYears = this.getValidYearsWithData();

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
        cx = parseFloat(el.getAttribute('data-cx') || '0');
        cy = parseFloat(el.getAttribute('data-cy') || '0');
      }

      if (!cx && !cy) return;

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
        (rect as any).__data__ = d;
        el.parentNode?.replaceChild(rect, el);
      } else {
        // Grey Circle with radius 4 and NO border
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        circle.setAttribute('r', '4');
        circle.setAttribute('class', 'c3-circle neutral-point');
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
        cx = parseFloat(el.getAttribute('data-cx') || '0');
        cy = parseFloat(el.getAttribute('data-cy') || '0');
      }

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
