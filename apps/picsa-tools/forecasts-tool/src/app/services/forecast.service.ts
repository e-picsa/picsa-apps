import { effect, Injectable, signal } from '@angular/core';
import { IUserSettings } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { FORECASTS_DB } from '@picsa/data/climate/forecasts';
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

@Injectable({ providedIn: 'root' })
export class ForecastService extends PicsaAsyncService {
  /** Toggle service effects on/off when pages are in view */
  public enabled = signal(false);

  public dailyForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });
  public seasonalForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });
  public downscaledForecastDocs = signal<RxDocument<IForecast>[]>([], { equal: isEqual });

  /** Track downscaled location for use in effects */
  private downscaledLocation = signal<IDownscaledLocation>({}, { equal: isEqual });
  /** Track country location for use in effects */
  private countryLocation = signal<ICountryCode | undefined>(undefined);

  private get table() {
    return this.supabaseService.db.table('forecasts');
  }
  private get dbCollection() {
    return this.dbService.db.collections['forecasts'] as RxCollection<IForecast>;
  }

  constructor(
    private supabaseService: SupabaseService,
    private dbService: PicsaDatabase_V2_Service,
    private dbAttachmentService: PicsaDatabaseAttachmentService,
  ) {
    super();
    effect(async () => {
      const country_code = this.countryLocation();
      if (country_code) {
        await this.ready();
        this.loadDailyForecasts(country_code);
        this.loadSeasonalForecasts(country_code);
      }
    });

    effect(async () => {
      const { country_code, admin_4, admin_5 } = this.downscaledLocation();
      if (country_code && admin_4) {
        await this.ready();
        this.loadDownscaledForecasts(country_code, admin_4, admin_5);
      } else {
        this.downscaledForecastDocs.set([]);
      }
    });
  }
  public override async init(...args: any): Promise<void> {
    await this.dbService.ensureCollections({
      forecasts: FORECAST_COLLECTION,
    });
  }

  public setForecastLocation(location?: IUserSettings['location']) {
    if (location) {
      const country_code = location[2] as ICountryCode;
      this.countryLocation.set(country_code);
      this.downscaledLocation.set({ country_code, admin_4: location[4], admin_5: location[5] });
    } else {
      this.countryLocation.set(undefined);
      this.downscaledLocation.set({});
    }
  }

  private async loadDownscaledForecasts(country_code: string, admin_4: string, admin_5?: string) {
    const filters: ((v: IForecastRow) => boolean)[] = [
      (v) => v.forecast_type === 'downscaled',
      (v) => v.country_code === country_code,
      (v) => v.location?.[0] === admin_4,
      // if admin_5 not used will be undefined in both comparisons
      (v) => v.location?.[1] === admin_5,
    ];
    const forecasts = FORECASTS_DB.filter((v) => filters.every((fn) => fn(v)));
    const dbDocs = await this.hackStoreHardcodedData(forecasts);
    this.downscaledForecastDocs.set(dbDocs);
  }

  private async hackStoreHardcodedData(forecasts: IForecastRow[] = []) {
    const { error, success } = await this.dbCollection.bulkUpsert(
      forecasts.map((forecast) => SERVER_DB_MAPPING(forecast)),
    );
    if (error.length > 0) {
      console.error('forecast store error', error);
      return [];
    }
    return success;
  }

  private async loadDailyForecasts(country_code: ICountryCode) {
    // populate any forecasts that are in the cache
    const cachedForecasts = await this.loadCachedForecasts(country_code);
    this.dailyForecastDocs.set(cachedForecasts);
    // load new forecasts from the server
    const serverForecasts = await this.loadServerForecasts(country_code, cachedForecasts[0]);
    if (serverForecasts.length > 0) {
      const { success, error } = await this.saveForecasts(serverForecasts);
      if (error.length > 0) {
        console.error(error);
        throw new Error(`[Forecast] failed to load daily forecasts`);
      }
      this.dailyForecastDocs.update((v) => [...success, ...v].slice(0, 3));
    }
  }
  private async loadSeasonalForecasts(country_code: ICountryCode) {
    const seaonalForecasts = FORECASTS_DB.filter(
      (v) => v.country_code === country_code && v.forecast_type === 'seasonal',
    );
    const dbDocs = await this.hackStoreHardcodedData(seaonalForecasts);
    this.seasonalForecastDocs.set(dbDocs);
  }

  public async downloadForecastFile(doc: RxDocument<IForecast>, downloaderUI: SupabaseStorageDownloadComponent) {
    await downloaderUI.start();
    const { error, data } = await downloaderUI.completed();
    if (error) {
      // TODO - handle
      console.error(error);
      throw new Error(`Download failed: ${error.message}`);
    }
    if (data && data instanceof Blob) {
      const attachmentId = downloaderUI.storage_path();
      await this.dbAttachmentService.ready();
      const updatedDoc = await this.dbAttachmentService.putAttachment(doc, attachmentId, data);
      return updatedDoc;
    }
    return doc;
  }

  private async loadCachedForecasts(country_code: string) {
    // only filter if non-global country used
    const selector: MangoQuerySelector<IForecast> = { forecast_type: 'daily' };
    if (country_code !== 'global') {
      selector.country_code = country_code;
    }
    const cached = await this.dbCollection.find({ selector, sort: [{ id: 'desc' }], limit: 3 }).exec();
    return cached;
  }

  private async saveForecasts(forecasts: IForecast[]) {
    const saved = await this.dbCollection.bulkUpsert(forecasts);
    return saved;
  }

  private async loadServerForecasts(country_code: string, latest?: IForecast): Promise<IForecast[]> {
    await this.supabaseService.ready();
    // only retrieve forecasts that have storage files stored
    // NOTE - these are populated on a separate cron schedule to forecast db entries
    const query = this.table.select<'*', IForecastRow>('*').neq('storage_file', null);
    if (country_code !== 'global') {
      query.eq('country_code', country_code);
    }
    if (latest) {
      query.gt('id', latest.id);
    }
    const { data = [], error } = await query.order('id', { ascending: false }).limit(3);
    if (error) {
      console.error(error);
      // TODO - handle error
      throw error;
    }
    return (data || []).map((el) => SERVER_DB_MAPPING(el));
  }
}
