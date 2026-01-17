import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { ngRouterMergedSnapshot$ } from '@picsa/utils/angular';
import { catchError, concat, concatMap, from, map, mergeMap, of } from 'rxjs';

import { DeploymentDashboardService } from '../deployment/deployment.service';
import { IDeploymentRow } from '../deployment/types';
import { ApiMapping } from './climate-api.mapping';
import { ClimateApiService } from './climate-api.service';
import { IAPICountryCode, IClimateStationData, IStationRow } from './types';

export interface IDataRefreshStatus {
  status: 'fulfilled' | 'rejected' | 'pending';
  id: string;
  index: number;
  value?: any;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class ClimateService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private api = inject(ClimateApiService);
  private router = inject(Router);
  private deploymentSevice = inject(DeploymentDashboardService);
  private notificationService = inject(PicsaNotificationService);

  public apiStatus: number;
  public stations = signal<IStationRow[]>([]);

  /** Lookup active station from stationId param and db stations list*/
  public activeStation = computed<IStationRow>(() => {
    const stations = this.stations();
    const activeStationId = this.activeStationId();
    if (stations.length > 0) {
      const station = stations.find((station) => station.station_id === activeStationId);
      if (station) return station;
      else {
        this.router.navigate(['climate', 'station']);
        this.notificationService.showErrorNotification(`[Climate Station] data not found: ${activeStationId}`);
      }
    }
    // UI components aren't rendered unless station defined so can safely ignore this return type
    return null as any;
  });
  /** Country code used for api requests */
  public apiCountryCode: IAPICountryCode;

  /** Trigger API request that includes mapping response to local database */
  public loadFromAPI = ApiMapping(this.api, this, this.supabaseService, this.supabaseService.storage);

  // Create a signal to represent current stationId as defined by route params
  private activeStationId = toSignal(
    ngRouterMergedSnapshot$(this.router).pipe(map(({ params }) => decodeURIComponent(params.stationId))),
  );

  constructor() {
    super();
    this.ready();
    // Update list of available stations for deployment country code and station id on change
    effect(async () => {
      const deployment = this.deploymentSevice.activeDeployment();
      if (deployment) {
        await this.loadData(deployment);
      }
    });
  }
  private get stationDataDB() {
    return this.supabaseService.db.table('climate_station_data');
  }

  public override async init() {
    await this.supabaseService.ready();
  }

  /** Get DB station data row for a specific station id */
  public getStationData(stationId: string) {
    return this.stationDataDB.select<'*', IClimateStationData['Row']>('*').eq('station_id', stationId).maybeSingle();
  }
  /** Get DB station data for all entries within a specific country */
  public getAllStationData(countryCode: string) {
    return this.stationDataDB.select<'*', IClimateStationData['Row']>('*').eq('country_code', countryCode as any);
  }

  /** Update DB with partial station data update */
  public async updateStationData(station: IStationRow, update: IClimateStationData['Update']) {
    return this.stationDataDB.upsert({
      ...update,
      country_code: station.country_code as any,
      station_id: station.id as string,
    });
  }

  public updateStationDataFromApi(station: IStationRow, concurrent = false) {
    const requests = [
      {
        id: 'Annual Rainfall',
        fn: this.loadFromAPI.rainfallSummaries(station),
      },
      {
        id: 'Crop Probabilities',
        fn: this.loadFromAPI.cropProbabilities(station),
      },
      {
        id: 'Annual Temperatures',
        fn: this.loadFromAPI.annualTemperature(station),
      },
      {
        id: 'Monthly Temperatures',
        fn: this.loadFromAPI.monthlyTemperatures(station),
      },
      // {
      //   id: 'Season Start',
      //   fn: this.loadFromAPI.seasonStart(station),
      // },
      // {
      //   id: 'Extremes',
      //   fn: this.loadFromAPI.extremes(station),
      // },
    ];

    // Start all requests with pending status
    // 1️⃣ Emit all pending statuses right away
    const pendings$ = from(
      requests.map(
        ({ id }, index): IDataRefreshStatus => ({
          status: 'pending',
          id,
          index,
        }),
      ),
    );

    // Choose operator depending on whether wanting to make requests concurrently or not
    // 2️⃣ Choose operator: sequential (`concatMap`) or concurrent (`mergeMap`)
    const operator = concurrent ? mergeMap : concatMap;

    const execution$ = from(requests).pipe(
      operator(({ fn, id }, index) =>
        from(fn).pipe(
          map((value): IDataRefreshStatus => ({ status: 'fulfilled', id, value, index })),
          catchError((reason) => of<IDataRefreshStatus>({ status: 'rejected', id, reason, index })),
        ),
      ),
    );

    // 3️⃣ Concatenate: pendings first, then results
    return concat(pendings$, execution$);
  }

  private async loadData(deployment: IDeploymentRow) {
    // allow configuration override for country_code
    const configuration = deployment.configuration as any;
    const targetCode = configuration.climate_country_code || deployment.country_code;
    // refresh list of stations on deployment country code change (or if forced update)
    if (targetCode !== this.apiCountryCode) {
      this.apiCountryCode = targetCode;
      await this.ready();
      await this.listStations(targetCode);
    }
  }

  private async listStations(country_code: string) {
    // TODO - when running should refresh from server as cron task
    const { data, error } = await this.supabaseService.db
      .table('climate_stations')
      .select<'*', IStationRow>('*')
      .eq('country_code', country_code);
    if (error) {
      throw error;
    }
    if (data?.length > 0) {
      this.stations.set(data);
    } else {
      // NOTE - api will also update station signal
      await this.loadFromAPI.station(country_code);
    }
  }
}
