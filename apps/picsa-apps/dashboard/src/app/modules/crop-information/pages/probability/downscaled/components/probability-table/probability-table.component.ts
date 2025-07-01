import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { AlertBoxComponent } from '@picsa/components/src';
import { CropProbabilityTableComponent as CropProbabilityTableFrontend } from '@picsa/crop-probability/src/app/components/crop-probability-table/crop-probability-table.component';
import type { IProbabilityTableStationMeta, IStationCropData } from '@picsa/crop-probability/src/app/models';
import { MONTH_DATA } from '@picsa/data';
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
      dateHeadings: PLANTING_DATES.map((v) => v.label),
      label: this.station().station_name as string,
      notes: [],
      // TODO
      seasonProbabilities: [],
    };
  });

  constructor(private service: CropInformationService) {}

  private generateTable(params: {
    cropDataHashmap: Record<string, ICropData['Row']>;
    waterRequirements: ICropDataDownscaledWaterRequirements;
  }) {
    const { cropDataHashmap, waterRequirements } = params;
    const entries: IStationCropData[] = [];
    for (const [crop, requirements] of Object.entries(waterRequirements)) {
      const entry: IStationCropData = {
        crop: crop as any,
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

    return entries;
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
      const mean = (probabilities.lower[i] + probabilities.upper[i]) / 2;
      return `${toProbabilityOutOfTen(mean)} / 10`;

      // TODO - previous output present sorted range, e.g 0-2, but that loses clarity on which condition led to which probability
      // would also include .5 rounding but only in some cases... overall a bit confusing
      const upper = toProbabilityOutOfTen(probabilities.upper[i]);
      const lower = toProbabilityOutOfTen(probabilities.lower[i]);
      if (upper === lower) {
        return `${upper}`;
      }
      return [lower, upper].sort().join('-');
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

/*************************************************************
 * TODO - sort legacy code
 *************************************************************/

// effect(async () => {
//   const location = this.locationSelected();
//   const countryCode = location[2];
//   const downscaledCode = location[4];
//   if (countryCode && downscaledCode) {
//     this.setMapBounds(countryCode, downscaledCode);
//     await this.loadLocationCropData(countryCode, downscaledCode);
//   }
// });

// effect(async () => {
//   const location = this.locationSelected();
//   const countryCode = location[2];
//   const downscaledCode = location[4];
//   if (countryCode && downscaledCode) {
//     this.setMapBounds(countryCode, downscaledCode);
//     await this.loadLocationCropData(countryCode, downscaledCode);
//   }
// });

// private async setMapBounds(countryCode: string, downscaledCode: string) {
//   // Load admin 4 boundaries and put on map
//   const geoData = GEO_LOCATION_DATA[countryCode] as IGelocationData;
//   const topoJson = await geoData.admin_4.topoJson();
//   const feature = topoJsonToGeoJson(topoJson);

//   feature.features = feature.features.filter((v) => v.properties.name === downscaledCode);
//   const map = this.picsaMapComponent().map();
//   const geoFeature = geoJSON(feature as any);
//   geoFeature.setStyle({ fill: false, color: 'brown', opacity: 0.5 }).addTo(map);
//   map.fitBounds(geoFeature.getBounds());
// }

/**
   <!-- <p>Select station to use for crop probabilities</p>
  <div class="w-96 h-96">
    <picsa-map style="width: 100%; height: 100%"></picsa-map>
  </div> -->
  <!-- <picsa-form-location-select
    [countryCode]="countryCode()"
    [value]="locationSelected()"
    (valueChanged)="handleLocationUpdate($event)"
  ></picsa-form-location-select> -->
 */
