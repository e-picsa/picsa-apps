import { computed, effect, inject, Injectable, untracked } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
import {
  ClimateTimespanMode,
  IChartMeta,
  IMonthlyStationData,
  IStationData,
  IStationMeta,
  IThreeMonthPeriod,
} from '@picsa/models';
import { aggregateThreeMonthSeries, arrayToHashmap, convertMonthlyToStationData, deepClone, filterMonthlyDataByMonth, loadCSV } from '@picsa/utils';

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
  private loadedMonthlyData: Record<string, IMonthlyStationData[]> = {};
  private loadedTimespanBounds: Record<string, IStationData[]> = {};

  constructor() {
    effect(() => {
      // trigger effect when list of stations changes
      this.stations();
      const userSettings = this.configurationService.userSettings();
      const stationId = userSettings.climate_tool?.station_id;
      if (stationId && !this.stationHashmap()[stationId]) {
        this.setPreferredStation('');
      }
    });
  }

  /** Retrieve the preferred station ID from user settings */
  public getPreferredStation(): string | undefined {
    const userSettings = this.configurationService.userSettings();
    const stationId = userSettings.climate_tool?.station_id;
    if (stationId && this.stationHashmap()[stationId]) {
      return stationId;
    }
    return undefined;
  }

  /** Allow user to set preferred station */
  public setPreferredStation(stationID: string) {
    // ensure any parent effects that are used to configure are not re-triggered
    // following changes to user settings (signal effects track dependencies within function invocation).
    // NOTE - this is only required for sync functions, async would not track within invocations
    untracked(() => {
      const currentSettings = this.configurationService.userSettings();
      if (stationID !== currentSettings.climate_tool?.station_id) {
        this.configurationService.updateUserSettings({
          climate_tool: {
            ...currentSettings.climate_tool,
            station_id: stationID,
          },
        });
      }
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

  public async getMonthlyStationData(stationId: string): Promise<IMonthlyStationData[]> {
    const data = this.loadedMonthlyData[stationId];
    if (data) {
      return data;
    }
    console.log('[Climate] Load Monthly Data', stationId);
    const station = this.stationHashmap()[stationId];
    if (!station) {
      return [];
    }
    const { countryCode, id } = station;
    const summaries = await loadCSV<IMonthlyStationData>(`assets/summaries/${countryCode}/${id}.monthly.csv`, {
      download: true,
      dynamicTyping: true,
      header: true,
      transform: (v) => {
        if (v === 'null' || v === '') return null;
        return v;
      },
    });
    this.loadedMonthlyData[stationId] = summaries || [];
    return this.loadedMonthlyData[stationId];
  }

  /**
   * Resolve dataset representing all observations for the specified timespan mode.
   * - annual: annual station records (Boundary C)
   * - monthly: all monthly records across all 12 months (Boundary A)
   * - three_month: all aggregated 3-month records across all available periods (Boundary B)
   */
  public async getTimespanBoundsData(
    stationId: string,
    mode: ClimateTimespanMode,
    periods?: IThreeMonthPeriod[],
  ): Promise<IStationData[]> {
    if (mode === 'annual') {
      const data = await this.getStationData(stationId);
      return data || [];
    }

    const cacheKey = `${stationId}_${mode}`;
    if (this.loadedTimespanBounds[cacheKey]) {
      return this.loadedTimespanBounds[cacheKey];
    }

    const monthlyData = await this.getMonthlyStationData(stationId);
    let boundsData: IStationData[] = [];

    if (mode === 'monthly') {
      boundsData = convertMonthlyToStationData(monthlyData);
    } else if (mode === 'three_month') {
      const activePeriods = periods && periods.length > 0 ? periods : [];
      boundsData = activePeriods.flatMap((p) => aggregateThreeMonthSeries(monthlyData, p));
    }

    this.loadedTimespanBounds[cacheKey] = boundsData;
    return boundsData;
  }

  public async getTimespanData(
    stationId: string,
    mode: ClimateTimespanMode,
    month: number,
    period?: IThreeMonthPeriod,
  ): Promise<IStationData[]> {
    if (mode === 'annual') {
      const data = await this.getStationData(stationId);
      return data || [];
    }
    const monthlyData = await this.getMonthlyStationData(stationId);
    if (mode === 'monthly') {
      return filterMonthlyDataByMonth(monthlyData, month);
    }
    return period ? aggregateThreeMonthSeries(monthlyData, period) : [];
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
