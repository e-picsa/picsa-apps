import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';

export interface DataPoint {
  total_rain: number;
  plant_length: number;
  probability: number;
}

interface GridCell {
  total_rain: number;
  plant_length: number;
  probability: number | null;
  backgroundColor: string;
  textColor: string;
}

@Component({
  selector: 'dashboard-climate-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardClimateDataGridComponent {
  data = input.required<Signal<DataPoint[]>>();

  rainfallValues = computed(() => Array.from(new Set(this.data()().map((d) => d.total_rain))).sort((a, b) => a - b));

  plantingLengthValues = computed(() =>
    Array.from(new Set(this.data()().map((d) => d.plant_length))).sort((a, b) => a - b),
  );

  cellGrid = computed(() => {
    const grid: Record<number, Record<number, number>> = {};
    for (const d of this.data()()) {
      if (!grid[d.total_rain]) {
        grid[d.total_rain] = {};
      }
      grid[d.total_rain][d.plant_length] = d.probability;
    }

    return this.rainfallValues().map((rf) =>
      this.plantingLengthValues().map((pl) => {
        const prob = grid[rf]?.[pl];
        return {
          total_rain: rf,
          plant_length: pl,
          probability: prob ?? null,
          backgroundColor: prob !== undefined ? this.probabilityColor(prob) : 'transparent',
          textColor: prob !== undefined ? this.textColor(prob) : '#000',
        } as GridCell;
      }),
    );
  });

  private probabilityColor(p: number): string {
    const brown = [188, 145, 99];
    const green = [91, 158, 91];
    const r = Math.round(brown[0] + (green[0] - brown[0]) * p);
    const g = Math.round(brown[1] + (green[1] - brown[1]) * p);
    const b = Math.round(brown[2] + (green[2] - brown[2]) * p);
    return `rgb(${r},${g},${b})`;
  }

  private textColor(p: number): string {
    return p > 0.5 ? '#fff' : '#000';
  }
}
