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
      return DATA.HARDCODED_STATIONS.filter((station) => station.countryCode === country_code && !station.draft);
    }
  });

  private stationHashmap = computed(() => arrayToHashmap(this.stations(), 'id'));

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
      const cleaned = this.hackCleanMissingValues(summaries);
      this.stationDataCache[stationID].data = cleaned;
    }
    // HACK - ensure chart definitions don't persist across sites
    return JSON.parse(JSON.stringify(this.stationDataCache[stationID]));
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
