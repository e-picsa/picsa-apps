import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AlertBoxComponent } from '@picsa/components/src';
import { CropProbabilityTableComponent as CropProbabilityTableFrontend } from '@picsa/crop-probability/src/app/components/crop-probability-table/crop-probability-table.component';
import type { IProbabilityTableStationMeta, IStationCropData } from '@picsa/crop-probability/src/app/models';
import { ICropName, MONTH_DATA } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';
import { ICropSuccessEntry, IStationRow } from 'apps/picsa-apps/dashboard/src/app/modules/climate/types';

import { CropInformationService, ICropData, ICropDataDownscaledWaterRequirements } from '../../../../../services';

// HACK - current data system hardcodes ranges, so try to match
// NOTE - this is a temporary measure and only works for data with 180 day offset
const PLANTING_DATES = [93, 108, 123, 138, 153, 168, 183].map((value) => {
  const d = new Date(2025, 0);
  // TODO - +181 used in some local met but need to check with definitions/get api to return day of year
  // Sometimes also 182/183
  d.setDate(value + 181);
  return { value, label: `${d.getDate()}-${MONTH_DATA[d.getMonth()].labelShort}` };
});

const WATER_REQUIREMENT_ROUNDING = 25;
const DAY_REQUIREMENT_ROUNDING = 15;

const CROP_SORT_PRIORITY: ICropName[] = [
  'maize',
  'sorghum',
  'beans',
  'groundnuts',
  'soya-beans',
  'sunflower',
  'cowpeas',
  'cotton',
  'tobacco',
  'sweet-potatoes',
];

@Component({
  selector: 'dashboard-crop-probability-table',
  imports: [CommonModule, AlertBoxComponent, MatButtonModule, RouterModule, CropProbabilityTableFrontend],
  templateUrl: './probability-table.component.html',
  styleUrl: './probability-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent {
  /** Location water requiremetns */
  waterRequirements = input.required<ICropDataDownscaledWaterRequirements>();
  /** Station crop probability lookup table entries */
  stationProbabilities = input.required<ICropSuccessEntry[]>();
  /** Station row for use in missing station data redirect */
  station = input.required<IStationRow>();

  public hasDownscaledWaterRequirements = computed(() => Object.keys(this.waterRequirements()).length > 0);
  public hasStationCropProbabilities = computed(() => this.stationProbabilities().length > 0);

  private cropDataHashmap = computed(() => arrayToHashmap(this.service.cropData(), 'id'));
  private probabilityHashmap = computed(() => this.generateProbabilityHashmap(this.stationProbabilities()));

  public tableData = computed(() => {
    const cropDataHashmap = this.cropDataHashmap();
    const waterRequirements = this.waterRequirements() || {};
    return this.generateTable({ cropDataHashmap, waterRequirements });
  });

  public tableMeta = computed<IProbabilityTableStationMeta>(() => {
    return {
      id: this.station().station_name as string,
      dateHeadings: PLANTING_DATES.map((v) => v.label),
      label: this.station().station_name as string,
      notes: [],
      // TODO
      seasonProbabilities: [],
    };
  });

  constructor(
    private service: CropInformationService,
    public dialog: MatDialog,
  ) {}

  public exportAppJson() {
    const output = { meta: this.tableMeta(), data: this.tableData() };
    // TODO - export full app format (currently just logged)
    console.log(output);
  }

  private generateTable(params: {
    cropDataHashmap: Record<string, ICropData['Row']>;
    waterRequirements: ICropDataDownscaledWaterRequirements;
  }) {
    const { cropDataHashmap, waterRequirements } = params;
    const entries: IStationCropData[] = [];
    for (const [crop, requirements] of Object.entries(waterRequirements)) {
      const entry: IStationCropData = {
        crop: crop as ICropName,
        data: [],
      };
      for (const [variety, waterRequirement] of Object.entries(requirements)) {
        const varietyData = cropDataHashmap[`${crop}/${variety}`];
        if (varietyData) {
          const { days_lower, days_upper } = varietyData;
          const days = { lower: days_lower, upper: days_upper };
          const probabilities = {
            lower: this.getCropSuccessProbability(waterRequirement, days_lower),
            upper: this.getCropSuccessProbability(waterRequirement, days_upper),
          };
          const probabilityText = this.generateProbabilityEntryText(probabilities);
          // HACK - convert to legacy table format
          // TODO - review and possibly tidy up
          entry.data.push({
            days: [...new Set([days.lower, days_upper])].join(' - '),
            variety,
            probabilities: probabilityText,
            water: [`${waterRequirement}mm`],
          });
        } else {
          console.warn(`no variety data found for [${crop}/${variety}]`);
        }
      }
      entries.push(entry);
    }

    // sort by crop priority and replace crop name with label
    return entries.sort(this.sortByPriorityCrops);
  }

  private sortByPriorityCrops(a: IStationCropData, b: IStationCropData) {
    const aPriority = CROP_SORT_PRIORITY.includes(a.crop) ? CROP_SORT_PRIORITY.indexOf(a.crop) : 99;
    const bPriority = CROP_SORT_PRIORITY.includes(b.crop) ? CROP_SORT_PRIORITY.indexOf(b.crop) : 99;
    return aPriority - bPriority;
  }

  /** Create a hashmap or probabilities nested by water requirement and plant length */
  private generateProbabilityHashmap(entries: ICropSuccessEntry[]) {
    const hashmap: { [water_req: number]: { [plant_length: number]: { [plant_day: number]: number } } } = {};
    for (const entry of entries) {
      const { plant_day, plant_length, total_rain, prop_success_no_start } = entry;
      hashmap[total_rain] ??= {};
      hashmap[total_rain][plant_length] ??= {};
      hashmap[total_rain][plant_length][plant_day] = prop_success_no_start;
    }
    return hashmap;
  }

  private generateProbabilityEntryText(probabilities: { upper: number[]; lower: number[] }) {
    return PLANTING_DATES.map((v, i) => {
      const lower = probabilities.lower[i];
      const upper = probabilities.upper[i];
      if (typeof lower === 'number' && typeof upper === 'number') {
        const mean = (probabilities.lower[i] + probabilities.upper[i]) / 2;
        return `${toProbabilityOutOfTen(mean)} / 10`;
      }
      // If probability NaN simply return as empty string
      return '';
    });
  }

  private getCropSuccessProbability(water: number, days: number) {
    const waterRounded = roundToNearest(water, WATER_REQUIREMENT_ROUNDING);
    const daysRounded = roundToNearest(days, DAY_REQUIREMENT_ROUNDING);
    const probabilities: number[] = [];
    for (const { value } of PLANTING_DATES) {
      const probability = this.probabilityHashmap()[waterRounded]?.[daysRounded]?.[value];
      probabilities.push(probability);
    }

    return probabilities;
  }
}

function roundToNearest(value: number, n: number) {
  return Math.round(value / n) * n;
}
function toProbabilityOutOfTen(value: number) {
  return Math.round(value * 10);
}
