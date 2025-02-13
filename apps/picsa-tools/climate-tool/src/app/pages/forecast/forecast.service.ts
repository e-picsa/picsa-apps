import { Injectable, signal } from '@angular/core';
import { ICountryCode } from '@picsa/data';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { SupabaseService, SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { RxCollection, RxDocument } from 'rxdb';

import { IClimateForecastRow } from './forecast.types';
import { CLIMATE_FORECAST_COLLECTION } from './schemas';

/**
 * TODOs
 * - include forecast_type in all requests and make generic for daily, seasonal and downscaled
 * - storage file download/open (convert to resource)
 * - UI improvements (re-use existing collection?)
 * - Improved downscaled forecast filters
 */

@Injectable({ providedIn: 'root' })
export class ClimateForecastService {
  public dailyForecastDocs = signal<RxDocument<IClimateForecastRow>[]>([], { equal: isEqual });

  private get table() {
    return this.supabaseService.db.table('climate_forecasts');
  }
  private get dbCollection() {
    return this.dbService.db.collections['climate_forecasts'] as RxCollection<IClimateForecastRow>;
  }

  constructor(private supabaseService: SupabaseService, private dbService: PicsaDatabase_V2_Service) {}

  public async loadDailyForecasts(country_code: ICountryCode) {
    if (country_code) {
      await this.dbService.ensureCollections({
        climate_forecasts: CLIMATE_FORECAST_COLLECTION,
      });
      // populate any forecasts that are in the cache
      const cachedForecasts = await this.loadCachedForecasts(country_code);
      this.dailyForecastDocs.set(cachedForecasts);
      // load new forecasts from the server
      const serverForecasts = await this.loadServerForecasts(country_code, cachedForecasts[0]);
      if (serverForecasts.length > 0) {
        const { success, error } = await this.saveForecasts(serverForecasts);
        this.dailyForecastDocs.update((v) => [...success, ...v]);
      }
    }
  }

  public async downloadForecastFile(
    doc: RxDocument<IClimateForecastRow>,
    downloaderUI: SupabaseStorageDownloadComponent
  ) {
    await downloaderUI.start();
    const { error, data } = await downloaderUI.completed();
    if (error) {
      // TODO - handle
      console.error(error);
      throw new Error(`Download failed: ${error.message}`);
    }
    if (data && data instanceof Blob) {
      const attachmentId = downloaderUI.storage_path();
      doc.putAttachment({ id: attachmentId, data, type: data.type });
    }
    return doc;
  }

  private async loadCachedForecasts(country_code: string) {
    // only filter if non-global country used
    const selector = country_code === 'global' ? {} : { country_code };
    const cached = await this.dbCollection.find({ selector, sort: [{ id: 'desc' }], limit: 5 }).exec();
    return cached;
  }

  private async saveForecasts(forecasts: IClimateForecastRow[]) {
    const saved = await this.dbCollection.bulkUpsert(forecasts);
    return saved;
  }

  private async loadServerForecasts(country_code: string, latest?: IClimateForecastRow) {
    await this.supabaseService.ready();
    // only retrieve forecasts that have storage files stored
    // NOTE - these are populated on a separate cron schedule to forecast db entries
    const query = this.table.select('*').neq('storage_file', null);
    if (country_code !== 'global') {
      query.eq('country_code', country_code);
    }
    if (latest) {
      query.gt('id', latest.id);
    }
    const { data, error } = await query.order('id', { ascending: false }).limit(5);
    console.log('server latest', latest?.id, data);
    if (error) {
      console.error(error);
      // TODO - handle error
      throw error;
    }
    return data;
  }
}
