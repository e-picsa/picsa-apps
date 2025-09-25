import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MONTH_DATA } from '@picsa/data';
import { map } from 'rxjs';

import { IAnnualRainfallSummariesData, ICropSuccessEntry, IStationRow } from '../../../../climate/types';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled, ICropDataDownscaledWaterRequirements } from '../../../services';
import { CropLinkedStationSelectComponent } from './components/linked-station-select/linked-station-select.component';
import {
  CropProbabilityTableComponent,
  ISeasonStartProbability,
} from './components/probability-table/probability-table.component';

// Type generated when joining downscaled `station_id` with station data lookup
type ICropDataDownscaledWithStation = ICropDataDownscaled['Row'] & {
  station: IStationRow | null;
};

@Component({
  selector: 'dashboard-crop-probability-downscaled',
  imports: [
    CommonModule,
    CropLinkedStationSelectComponent,
    CropProbabilityTableComponent,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './probability-downscaled.component.html',
  styleUrl: './probability-downscaled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProbabilityDownscaledComponent {
  public locationId = toSignal(this.route.params.pipe(map((v) => v.locationId)));
  private countryCode = computed(() => this.deploymentService.activeDeployment()?.country_code);

  public downscaledData = signal<ICropDataDownscaledWithStation | undefined>(undefined);
  public downscaledStationId = computed(() => this.downscaledData()?.station_id);
  public downscaledWaterRequirements = computed(
    () => this.downscaledData()?.water_requirements as ICropDataDownscaledWaterRequirements,
  );
  public downscaledStationProbabilities = signal<ICropSuccessEntry[] | undefined>(undefined);

  public seasonStartProbabilities = signal<ISeasonStartProbability[]>([]);

  public showLinkedStationSelect = signal(false);

  public dataLoading = signal(true);
  public locationMeta = computed(() => {
    const downscaledData = this.downscaledData();
    return this.getLocationData(downscaledData);
  });

  constructor(
    private route: ActivatedRoute,
    private deploymentService: DeploymentDashboardService,
    private service: CropInformationService,
  ) {
    effect(() => {
      const location_id = this.locationId();
      const country_code = this.countryCode();
      if (location_id && country_code) {
        this.loadDownscaledCropInfo({ location_id, country_code });
      }
    });
    effect(() => {
      const stationId = this.downscaledStationId();
      if (stationId) {
        this.loadStationCropProbabilities(stationId);
      }
    });
  }

  public async updateLinkedStation(station_id?: string) {
    if (station_id) {
      const id = this.downscaledData()?.id as string;
      const updateRes = await this.service.cropDataDownscaledTable.update({ station_id }).eq('id', id);
      if (updateRes.error) {
        console.error(updateRes.error);
        throw updateRes.error;
      }
      // refresh data - do not await to allow ui to change over during reprocess
      const location_id = this.locationId();
      const country_code = this.countryCode();
      this.loadDownscaledCropInfo({ location_id, country_code });
    }
    this.showLinkedStationSelect.set(false);
  }

  private async loadDownscaledCropInfo(params: { country_code: string; location_id: string }) {
    const { country_code, location_id } = params;
    this.dataLoading.set(true);
    await this.service.ready();
    const mergedSelect = `*, station:climate_stations!station_id (*)`;
    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaledWithStation>(mergedSelect as any)
      .match({ country_code, location_id })
      .single();

    if (error) throw error;
    if (data) {
      this.downscaledData.set(data);
    }
    this.dataLoading.set(false);
  }

  private async loadStationCropProbabilities(station_id: string) {
    const { data, error } = await this.service.stationDataTable.select().eq('station_id', station_id).single();
    // no data error will handled at end
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    const cropProbabilityData = data?.crop_probability_data as ICropSuccessEntry[];
    const rainfallData = data?.annual_rainfall_data as IAnnualRainfallSummariesData[];
    if (cropProbabilityData) {
      this.downscaledStationProbabilities.set(cropProbabilityData);
      // derive season start probabilities
      if (rainfallData) {
        const probabilities = this.calcSeasonStartProbabilities(rainfallData, cropProbabilityData);
        this.seasonStartProbabilities.set(probabilities);
      }
      return;
    }
    // set empty array if no data available to still allow dummy table production
    this.downscaledStationProbabilities.set([]);
  }

  /** Lookup downscaled data id and return full geolocation data */
  private getLocationData(downscaledData?: ICropDataDownscaled['Row']) {
    if (downscaledData) {
      const locationData = this.deploymentService.activeDeploymentLocationData();
      const locations = locationData.admin_5?.locations || locationData.admin_4.locations;
      const match = locations.find((v) => v.id === downscaledData.location_id);
      if (match) {
        return match;
      }
    }
    return { id: '', label: '' };
  }

  private calcSeasonStartProbabilities(
    rainfallData: IAnnualRainfallSummariesData[],
    probabilityData: ICropSuccessEntry[],
  ) {
    const allStartDates = rainfallData.map((d) => d.start_rains_doy).filter((v) => typeof v === 'number');
    const uniquePlantDates = [...new Set(probabilityData.map((v) => v.plant_day))];
    const cdf = cumulativeDistribution(allStartDates);

    // Lookup each plant date and find total number of years >= value ()
    const total = allStartDates.length;
    return (
      uniquePlantDates
        .map((plantDate) => ({
          plantDate,
          probability: cdf[plantDate + 1] / total,
          label: plantDayToDateLabel(plantDate),
        }))
        // only include non-zero probability start dates
        .filter(({ probability }) => probability >= 0.05)
    );
  }
}

// HACK - current data system hardcodes ranges, so try to match
// NOTE - this is a temporary measure and only works for data with 180 day offset
function plantDayToDateLabel(plantDate: number) {
  const d = new Date(2025, 0);
  // TODO - +181 used in some local met but need to check with definitions/get api to return day of year
  // Sometimes also 182/183
  d.setDate(plantDate + 181);
  return `${d.getDate()}-${MONTH_DATA[d.getMonth()].labelShort}`;
}

/**
 * Calculates the cumulative distribution function (CDF) for a given data set.
 * To calculate probability `<= `a value use `cdf[value+1]`
 *
 * Uses counting sort and prefix sums for O(1) lookups after O(n) preprocessing.
 * Generated using GPT-4.1
 *
 * @param data - Array of observed values
 */
function cumulativeDistribution(data: number[]) {
  // Step 1: Count occurrences of each number.
  // Use array length Max + 1 for number 0, 1, ... MAX
  const MAX = Math.max(...data);
  const counts = new Array(MAX + 1).fill(0);
  for (const num of data) counts[num]++;

  // Step 2: Build prefix sums
  // To query <= value we will need to select cdf[prefix + 1], so ensure MAX + 2 entries
  const cdf = new Array(MAX + 2).fill(0);
  for (let i = 1; i <= MAX + 1; i++) {
    cdf[i] = cdf[i - 1] + counts[i - 1];
  }

  return cdf;
}
