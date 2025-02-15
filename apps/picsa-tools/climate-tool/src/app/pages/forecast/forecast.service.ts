import { Injectable, signal } from '@angular/core';
import { ICountryCode } from '@picsa/data';
import { IResourceCollection } from '@picsa/resources/src/app/schemas';
import { ResourcesToolService } from '@picsa/resources/src/app/services/resources-tool.service';
import { PicsaDatabase_V2_Service } from '@picsa/shared/services/core/db_v2';
import { SupabaseService, SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { RxCollection, RxDocument } from 'rxdb';

import { IClimateForecastRow } from './forecast.types';
import { CLIMATE_FORECAST_COLLECTION, IClimateForecast, SERVER_DB_MAPPING } from './schemas';

/**
 * TODOs
 * - include forecast_type in all requests and make generic for daily, seasonal and downscaled
 * - storage file download/open (convert to resource)
 * - UI improvements (re-use existing collection?)
 * - Improved downscaled forecast filters
 */

@Injectable({ providedIn: 'root' })
export class ClimateForecastService {
  public dailyForecastDocs = signal<RxDocument<IClimateForecast>[]>([], { equal: isEqual });

  public downscaledForecastsCollection = signal<RxDocument<IResourceCollection> | null>(null);

  private get table() {
    return this.supabaseService.db.table('climate_forecasts');
  }
  private get dbCollection() {
    return this.dbService.db.collections['climate_forecasts'] as RxCollection<IClimateForecast>;
  }

  constructor(
    private supabaseService: SupabaseService,
    private dbService: PicsaDatabase_V2_Service,
    private resourcesService: ResourcesToolService
  ) {}

  public async loadForecasts(country_code: ICountryCode) {
    if (country_code) {
      this.loadDailyForecasts(country_code);
      this.loadDownscaledForecasts();
    }
  }

  private async loadDailyForecasts(country_code: ICountryCode) {
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
      if (error.length > 0) {
        console.error(error);
        throw new Error(`[Forecast] failed to load daily forecasts`);
      }
      this.dailyForecastDocs.update((v) => [...success, ...v].slice(0, 5));
    }
  }

  private async loadDownscaledForecasts() {
    // TODO - load hardcoded into service schema instead of resources (?)
    // TODO - or integrate into DB (might be better)
    await this.resourcesService.ready();
    const downscaled = await this.resourcesService.dbCollections.findOne('forecasts_downscaled').exec();
    this.downscaledForecastsCollection.set(downscaled);
  }

  public async downloadForecastFile(
    doc: RxDocument<IClimateForecast>,
    downloaderUI: SupabaseStorageDownloadComponent
  ): Promise<RxDocument<IClimateForecast>> {
    await downloaderUI.start();
    const { error, data } = await downloaderUI.completed();
    if (error) {
      // TODO - handle
      console.error(error);
      throw new Error(`Download failed: ${error.message}`);
    }
    if (data && data instanceof Blob) {
      const attachmentId = downloaderUI.storage_path();
      const { doc: updatedDoc } = await doc.putAttachment({ id: attachmentId, data, type: data.type });
      return updatedDoc;
    }
    return doc;
  }

  private async loadCachedForecasts(country_code: string) {
    // only filter if non-global country used
    const selector = country_code === 'global' ? {} : { country_code };
    const cached = await this.dbCollection.find({ selector, sort: [{ id: 'desc' }], limit: 5 }).exec();
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
    const { data = [], error } = await query.order('id', { ascending: false }).limit(5);
    console.log('server latest', latest?.id, data);
    if (error) {
      console.error(error);
      // TODO - handle error
      throw error;
    }
    return (data || []).map((el) => SERVER_DB_MAPPING(el));
  }
}
