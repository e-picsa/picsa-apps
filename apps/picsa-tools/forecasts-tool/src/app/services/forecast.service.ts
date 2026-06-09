import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { IUserSettings } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { FORECASTS_DB } from '@picsa/data/climate/forecasts';
import type { CountryCodeLegacy } from '@picsa/server-types';
import { PicsaAsyncService } from '@picsa/shared/services/asyncService.service';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseService, SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { MangoQuerySelector, RxCollection, RxDocument } from 'rxdb';

import { FORECAST_COLLECTION, IForecast, SERVER_DB_MAPPING } from '../schemas';
import { IForecastRow } from '../types/forecast.types';

interface IDownscaledLocation {
  country_code?: ICountryCode;
  admin_4?: string;
  admin_5?: string;
}

type ForecastType = 'daily' | 'weekly' | 'seasonal' | 'downscaled';

interface LoaderConfig {
  type: ForecastType;
  signal: WritableSignal<RxDocument<IForecast>[]>;
  limit?: number;
  includeStorage?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ForecastService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private dbService = inject(PicsaDatabase_V2_Service);
  private dbAttachmentService = inject(PicsaDatabaseAttachmentService);

  public enabled = signal(false);

  public dailyForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });
  public weeklyForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });
  public seasonalForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });
  public downscaledForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });

  private downscaledLocation = signal<IDownscaledLocation>({}, { equal: isEqual });
  private countryLocation = signal<ICountryCode | undefined>(undefined);

  private activeCountryLoad?: { country_code: ICountryCode; cancelled: boolean };
  private activeDownscaledLoad?: { locationKey: string; cancelled: boolean };

  private loaderConfigs: LoaderConfig[] = [
    // TODO - limit not very useful, can have multiple translated versions
    //        Should try move to time-based filter/query instead, or better table replication
    { type: 'seasonal', signal: this.seasonalForecastDocs, limit: 2 },
    { type: 'downscaled', signal: this.downscaledForecastDocs, limit: 2 },
    { type: 'weekly', signal: this.weeklyForecastDocs, limit: 1, includeStorage: true },
    { type: 'daily', signal: this.dailyForecastDocs, limit: 3, includeStorage: true },
  ];

  private get dbCollection() {
    return this.dbService.db.collections['forecasts'] as RxCollection<IForecast>;
  }

  constructor() {
    super();
    // Start initialization asynchronously on creation
    this.ready();

    effect(() => {
      const isReady = this.readySignal();
      if (!isReady) return;

      const country_code = this.countryLocation();
      if (country_code) {
        this.loadForecastsForCountry(country_code);
      } else {
        if (this.activeCountryLoad) {
          this.activeCountryLoad.cancelled = true;
        }
        this.seasonalForecastDocs.set([]);
        this.weeklyForecastDocs.set([]);
        this.dailyForecastDocs.set([]);
      }
    });

    effect(() => {
      const isReady = this.readySignal();
      if (!isReady) return;

      const { country_code, admin_4, admin_5 } = this.downscaledLocation();
      if (country_code && admin_4) {
        this.loadDownscaledForecasts(country_code, admin_4, admin_5);
      } else {
        if (this.activeDownscaledLoad) {
          this.activeDownscaledLoad.cancelled = true;
        }
        this.downscaledForecastDocs.set([]);
      }
    });
  }

  public override async init(...args: any): Promise<void> {
    await this.supabaseService.ready();
    await this.dbService.ensureCollections({
      forecasts: FORECAST_COLLECTION,
    });
  }

  public setForecastLocation(location?: IUserSettings['location']) {
    if (location) {
      const country_code = location[2] as ICountryCode;
      this.countryLocation.set(country_code);
      this.downscaledLocation.set({
        country_code,
        admin_4: location[4],
        admin_5: location[5],
      });
    } else {
      this.countryLocation.set(undefined);
      this.downscaledLocation.set({});
    }
  }

  public async downloadForecastFile(doc: RxDocument<IForecast>, downloaderUI: SupabaseStorageDownloadComponent) {
    await downloaderUI.start();
    const { error, data } = await downloaderUI.completed();

    if (error) {
      console.error(error);
      throw new Error(`Download failed: ${error.message}`);
    }

    if (data instanceof Blob) {
      const attachmentId = downloaderUI.storage_path();
      await this.dbAttachmentService.ready();
      return await this.dbAttachmentService.putAttachment(doc, attachmentId, data);
    }

    return doc;
  }

  private async loadForecastsForCountry(country_code: ICountryCode) {
    if (this.activeCountryLoad) {
      this.activeCountryLoad.cancelled = true;
    }
    const currentLoad = { country_code, cancelled: false };
    this.activeCountryLoad = currentLoad;

    try {
      await Promise.all(
        this.loaderConfigs.map(async (config) => {
          if (config.type === 'seasonal') {
            const seasonalForecasts = FORECASTS_DB.filter(
              (v) => v.country_code === country_code && v.forecast_type === 'seasonal',
            );
            const dbDocs = await this.storeHardcodedData(seasonalForecasts);
            if (currentLoad.cancelled) return;
            config.signal.set(dbDocs);
            return;
          }

          const cached = await this.loadCachedForecasts(country_code, config.type, config.limit || 1);
          if (currentLoad.cancelled) return;
          config.signal.set(cached);

          if (config.includeStorage) {
            const serverForecasts = await this.loadServerForecasts(country_code, config.type, cached[0], config.limit);
            if (currentLoad.cancelled) return;

            if (serverForecasts.length > 0) {
              const { success, error } = await this.saveForecasts(serverForecasts);
              if (currentLoad.cancelled) return;
              if (error.length > 0) {
                console.error(error);
                throw new Error(`[Forecast] failed to load ${config.type} forecasts`);
              }
              config.signal.update((v) => [...success, ...v].slice(0, config.limit));
            }
          }
        }),
      );
    } catch (err) {
      console.error('[ForecastService] Error loading forecasts', err);
    }
  }

  private async loadServerForecasts(
    country_code: CountryCodeLegacy,
    forecast_type: ForecastType,
    latest?: IForecast,
    limit = 3,
  ): Promise<IForecast[]> {
    await this.supabaseService.ready();
    if (!this.supabaseService.isAvailable()) {
      console.warn('[Forecast] Supabase server is not available, skipping loadServerForecasts');
      return [];
    }
    const table = this.supabaseService.db.table('forecasts');
    const query = table.select<'*', IForecastRow>('*').neq('storage_file', null).eq('forecast_type', forecast_type);

    if (country_code !== 'global') {
      query.eq('country_code', country_code);
    }

    if (latest) {
      query.gt('id', latest.id);
    }

    const { data, error } = await query.order('id', { ascending: false }).limit(limit);

    if (error) {
      console.error(error);
      throw error;
    }

    return (data || []).map((el) => SERVER_DB_MAPPING(el));
  }

  private async loadSeasonalForecasts(country_code: ICountryCode) {
    const seasonalForecasts = FORECASTS_DB.filter(
      (v) => v.country_code === country_code && v.forecast_type === 'seasonal',
    );
    const dbDocs = await this.storeHardcodedData(seasonalForecasts);
    this.seasonalForecastDocs.set(dbDocs);
  }

  private async loadDownscaledForecasts(country_code: string, admin_4: string, admin_5?: string) {
    const locationKey = `${country_code}||${admin_4}||${admin_5 || ''}`;
    if (this.activeDownscaledLoad) {
      this.activeDownscaledLoad.cancelled = true;
    }
    const currentLoad = { locationKey, cancelled: false };
    this.activeDownscaledLoad = currentLoad;

    try {
      const filters: ((v: IForecastRow) => boolean)[] = [
        (v) => v.forecast_type === 'downscaled',
        (v) => v.country_code === country_code,
        (v) => (admin_5 && v.downscaled_location === admin_5) || v.downscaled_location === admin_4,
      ];

      const forecasts = FORECASTS_DB.filter((v) => filters.every((fn) => fn(v)));
      const dbDocs = await this.storeHardcodedData(forecasts);
      if (currentLoad.cancelled) return;
      this.downscaledForecastDocs.set(dbDocs);
    } catch (err) {
      console.error('[ForecastService] Error loading downscaled forecasts', err);
    }
  }

  private async storeHardcodedData(forecasts: IForecastRow[] = []) {
    const { error, success } = await this.dbCollection.bulkUpsert(
      forecasts.map((forecast) => SERVER_DB_MAPPING(forecast)),
    );

    if (error.length > 0) {
      console.error('forecast store error', error);
      return [];
    }

    return success;
  }

  private async loadCachedForecasts(country_code: string, forecast_type: IForecast['forecast_type'], limit: number) {
    const selector: MangoQuerySelector<IForecast> = { forecast_type };

    if (country_code !== 'global') {
      selector.country_code = country_code;
    }

    return await this.dbCollection.find({ selector, sort: [{ id: 'desc' }], limit }).exec();
  }

  private async saveForecasts(forecasts: IForecast[]) {
    return await this.dbCollection.bulkUpsert(forecasts);
  }
}
