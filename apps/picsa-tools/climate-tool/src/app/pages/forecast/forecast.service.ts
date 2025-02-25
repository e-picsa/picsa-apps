import { Injectable, signal } from '@angular/core';
import { IUserSettings } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { CLIMATE_FORECASTS_DB } from '@picsa/data/climate/forecasts';
import { PicsaDatabase_V2_Service, PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseService, SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { MangoQuerySelector, RxCollection, RxDocument, RxQuery } from 'rxdb';

import { IClimateForecastRow } from './forecast.types';
import { CLIMATE_FORECAST_COLLECTION, IClimateForecast, SERVER_DB_MAPPING } from './schemas';

/**
 * TODOs
 * - HTML Open
 */

@Injectable({ providedIn: 'root' })
export class ClimateForecastService {
  public dailyForecastDocs = signal<RxDocument<IClimateForecast>[]>([], { equal: isEqual });
  public seasonalForecastDocs = signal<RxDocument<IClimateForecast>[]>([], { equal: isEqual });
  public downscaledForecastDocs = signal<RxDocument<IClimateForecast>[]>([], { equal: isEqual });

  private get table() {
    return this.supabaseService.db.table('climate_forecasts');
  }
  private get dbCollection() {
    return this.dbService.db.collections['climate_forecasts'] as RxCollection<IClimateForecast>;
  }

  constructor(
    private supabaseService: SupabaseService,
    private dbService: PicsaDatabase_V2_Service,
    private dbAttachmentService: PicsaDatabaseAttachmentService
  ) {}

  public async loadForecasts(location: IUserSettings['location'] = []) {
    await this.dbService.ensureCollections({
      climate_forecasts: CLIMATE_FORECAST_COLLECTION,
    });
    const country_code = location[2] as ICountryCode;
    const subLocationCode = location[4];
    if (country_code) {
      this.loadDailyForecasts(country_code);
      this.loadSeasonalForecasts(country_code);
      this.loadDownscaledForecasts(country_code, subLocationCode);
    }
  }

  private async hackStoreHardcodedData(forecasts: IClimateForecastRow[] = []) {
    const { error, success } = await this.dbCollection.bulkUpsert(
      forecasts.map((forecast) => SERVER_DB_MAPPING(forecast))
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
    const seaonalForecasts = CLIMATE_FORECASTS_DB.filter(
      (v) => v.country_code === country_code && v.forecast_type === 'seasonal'
    );
    const dbDocs = await this.hackStoreHardcodedData(seaonalForecasts);
    this.seasonalForecastDocs.set(dbDocs);
  }

  private async loadDownscaledForecasts(country_code: ICountryCode, subLocationCode: string | null) {
    if (!subLocationCode) {
      this.downscaledForecastDocs.set([]);
      return;
    }
    const downscaledForecasts = CLIMATE_FORECASTS_DB.filter(
      (v) =>
        v.country_code === country_code && v.forecast_type === 'downscaled' && v.location?.includes(subLocationCode)
    );
    const dbDocs = await this.hackStoreHardcodedData(downscaledForecasts);
    this.downscaledForecastDocs.set(dbDocs);
  }

  public async downloadForecastFile(doc: RxDocument<IClimateForecast>, downloaderUI: SupabaseStorageDownloadComponent) {
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
    const selector: MangoQuerySelector<IClimateForecast> = { forecast_type: 'daily' };
    if (country_code !== 'global') {
      selector.country_code = country_code;
    }
    const cached = await this.dbCollection.find({ selector, sort: [{ id: 'desc' }], limit: 3 }).exec();
    return cached;
  }

  private async saveForecasts(forecasts: IClimateForecast[]) {
    const saved = await this.dbCollection.bulkUpsert(forecasts);
    return saved;
  }

  private async loadServerForecasts(country_code: string, latest?: IClimateForecast): Promise<IClimateForecast[]> {
    await this.supabaseService.ready();
    // only retrieve forecasts that have storage files stored
    // NOTE - these are populated on a separate cron schedule to forecast db entries
    const query = this.table.select<'*', IClimateForecastRow>('*').neq('storage_file', null);
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
