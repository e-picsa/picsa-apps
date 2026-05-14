import { computed, inject, Injectable } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
import { IChartMeta, IStationData, IStationMeta } from '@picsa/models';
import { arrayToHashmap, deepClone, loadCSV } from '@picsa/utils';

import { CLIMATE_STATIONS_META } from '../data/stations';

@Injectable({ providedIn: 'root' })
export class ClimateDataService {
  private configurationService = inject(ConfigurationService);

  public activeChart: IChartMeta;
  public yValues: number[];

  /** List of all stations for current  */
  public stations = computed(() => {
    const { climateTool, country_code } = this.configurationService.deploymentSettings();
    const stations = CLIMATE_STATIONS_META[country_code] || [];
    const filterFn = climateTool?.station_filter;
    if (filterFn) {
      return stations.filter((station) => filterFn(station));
    } else {
      return stations.filter((station) => !station.draft);
    }
  });

  private stationHashmap = computed(() => arrayToHashmap(this.stations(), 'id'));

  private loadedStationData: Record<string, IStationData[]> = {};

  /** Retrieve the preferred station ID from user settings */
  public getPreferredStation(): string | undefined {
    const userSettings = this.configurationService.userSettings();
    return userSettings.climate_tool?.station_id;
  }

  /** Allow user to set preferred station */
  public setPreferredStation(stationID: string) {
    const currentSettings = this.configurationService.userSettings();
    this.configurationService.updateUserSettings({
      climate_tool: {
        ...currentSettings.climate_tool,
        station_id: stationID,
      },
    });
  }

  public async getStationMeta(stationID: string): Promise<IStationMeta> {
    const station = this.stationHashmap()[stationID];
    if (!station) {
      console.error('No data for station');
      return { name: 'Data not found' } as IStationMeta;
    }

    // HACK - ensure chart definitions don't persist across sites
    return deepClone(station);
  }
  public async getStationData(stationId: string) {
    const data = this.loadedStationData[stationId];
    if (data) {
      return data;
    } else {
      console.log('[Climate] Load Data', stationId);
      const summaries = await this.loadStationSummaries(stationId);
      const cleaned = this.hackCleanMissingValues(summaries);
      this.loadedStationData[stationId] = cleaned;
      return cleaned;
    }
  }

  /**
   * Remove data entries where 1 of start, end, length or rainfall not defined
   * This may be a null value, or 0 entry
   */
  private hackCleanMissingValues(data: IStationData[]) {
    return data.map((el) => {
      const { Start, End, Rainfall, Length } = el;
      const isMissingData = !Start || !End || !Rainfall || !Length;
      if (isMissingData) {
        el.Start = null as any;
        el.End = null as any;
        el.Length = null as any;
        el.Rainfall = null as any;
      }
      return el;
    });
  }

  private async loadStationSummaries(stationID: string) {
    const station = this.stationHashmap()[stationID];
    if (!station) {
      return [];
    }
    const { countryCode, id } = station;
    return loadCSV<IStationData>(`assets/summaries/${countryCode}/${id}.csv`, {
      download: true,
      dynamicTyping: true,
      header: true,
      transform: (v) => {
        // Ensure null string parsed
        if (v === 'null') return null;
        // HACK - replace 0 with null value
        if (v === '0') return null;
        return v;
      },
    });
  }
}
