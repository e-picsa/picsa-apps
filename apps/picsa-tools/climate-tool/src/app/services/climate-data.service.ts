import { computed, Injectable } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
import { IChartMeta, IStationData, IStationMeta } from '@picsa/models';
import { arrayToHashmap, loadCSV } from '@picsa/utils';

import * as DATA from '../data';

@Injectable({ providedIn: 'root' })
export class ClimateDataService {
  public activeChart: IChartMeta;
  public yValues: number[];

  /** Store populated station data to in-memory cache for fast future retrieval*/
  private stationDataCache: { [name: string]: IStationMeta } = {};

  /** List of all stations for current  */
  public stations = computed(() => {
    const { climateTool, country_code } = this.configurationService.deploymentSettings();
    const filterFn = climateTool?.station_filter;
    if (filterFn) {
      return DATA.HARDCODED_STATIONS.filter((station) => filterFn(station));
    } else {
      return DATA.HARDCODED_STATIONS.filter((station) => station.countryCode === country_code);
    }
  });

  constructor(private configurationService: ConfigurationService) {
    this.stationDataCache = arrayToHashmap(DATA.HARDCODED_STATIONS, 'id');
  }

  public async getStationMeta(stationID: string): Promise<IStationMeta> {
    const station = this.stationDataCache[stationID];
    if (!station) {
      console.error('No data for station');
      return { data: [] as any[], name: 'Data not found' } as IStationMeta;
    }
    if (!station.data) {
      console.log('[Climate] Load Data', stationID);
      const summaries = await this.loadStationSummaries(stationID);
      this.stationDataCache[stationID].data = summaries;
    }
    // HACK - ensure chart definitions don't persist across sites
    return JSON.parse(JSON.stringify(this.stationDataCache[stationID]));
  }
  private async loadStationSummaries(stationID: string) {
    return loadCSV<IStationData>(`assets/summaries/${stationID}.csv`, {
      download: true,
      dynamicTyping: true,
      header: true,
    });
  }
}
