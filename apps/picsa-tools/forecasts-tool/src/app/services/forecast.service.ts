import { computed, effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
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
export type DataSyncType = 'idle' | 'updating' | 'success' | 'offline' | 'error';

interface LoaderConfig {
  type: ForecastType;
  signal: WritableSignal<RxDocument<IForecast>[]>;
  limit?: number;
  includeStorage?: boolean;
}

class ForecastOfflineError extends Error {
  constructor() {
    super('Forecast server is offline/unavailable');
  }
}

interface ILoadOptions {
  /** Bypass incremental `gt(id)` query bounds and re-validate all recent server records */
  force?: boolean;
}

export const FORECAST_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

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

  public loadingForecasts = signal(false);
  public loadingDownscaled = signal(false);

  public syncState = signal<DataSyncType>('idle');
  public syncError = signal<string | undefined>(undefined);

  private readonly LAST_SYNC_STORAGE_KEY = 'picsa_forecast_last_sync';
  public lastSyncedAt = signal<string | undefined>(this.readPersistedSyncTime());
  public isForceRefreshing = signal(false);
  public isStale = computed(() => {
    const last = this.lastSyncedAt();
    if (!last) return true;
    return Date.now() - new Date(last).getTime() > FORECAST_STALE_THRESHOLD_MS;
  });

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
        this.loadingForecasts.set(false);
        this.syncState.set('idle');
        this.loadingForecasts.set(false);
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
        this.loadingDownscaled.set(false);
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

  // Force Refresh for latest forecasts for active country location
  public async forceRefresh(): Promise<void> {
    await this.ready();
    const country_code = this.countryLocation();
    if (!country_code) {
      this.syncState.set('idle');
      return;
    }
    // Prevent overlapping manual refreshes
    if (this.isForceRefreshing()) return;

    this.isForceRefreshing.set(true);
    try {
      await this.loadForecastsForCountry(country_code, { force: true });
    } finally {
      this.isForceRefreshing.set(false);
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

  private async loadForecastsForCountry(country_code: ICountryCode, options: ILoadOptions = {}) {
    const { force = false } = options;

    // Cancel any in-flight load (e.g. user switched location mid force-refresh)
    if (this.activeCountryLoad) {
      this.activeCountryLoad.cancelled = true;
    }
    const currentLoad = { country_code, cancelled: false };
    this.activeCountryLoad = currentLoad;

    // Filter out downscaled config from country load because it is loaded by the specific location effect
    const countryConfigs = this.loaderConfigs.filter((c) => c.type !== 'downscaled');

    try {
      // 1. Load cached data first (extremely fast local queries)
      const cachedData = await Promise.all(
        countryConfigs.map(async (config) => {
          if (config.type === 'seasonal') {
            const seasonalForecasts = FORECASTS_DB.filter(
              (v) => v.country_code === country_code && v.forecast_type === 'seasonal',
            );
            const dbDocs = await this.storeHardcodedData(seasonalForecasts);
            return { config, data: dbDocs };
          }
          const cached = await this.loadCachedForecasts(country_code, config.type, config.limit || 1);
          return { config, data: cached };
        }),
      );

      if (currentLoad.cancelled) return;

      // 2. Set the cached data to signals immediately
      for (const { config, data } of cachedData) {
        config.signal.set(data);
      }

      // 3. Now start loading from server (which might take time)
      const serverConfigs = countryConfigs.filter((c) => c.includeStorage);
      if (serverConfigs.length > 0) {
        this.loadingForecasts.set(true);
        this.syncState.set('updating');
        this.syncError.set(undefined);

        await this.supabaseService.ready();
        if (!this.supabaseService.isAvailable() || !this.isOnline()) {
          // Offline - keep cached data intact and surface feedback to the UI
          if (!currentLoad.cancelled) {
            this.syncState.set('offline');
            this.syncError.set('No internet connection. Showing previously downloaded forecasts.');
          }
          return;
        }

        await Promise.all(
          serverConfigs.map(async (config) => {
            const cached = config.signal();
            // On force refresh bypass the incremental bound so recent records are re-validated
            const latest = force ? undefined : cached[0];
            const serverForecasts = await this.loadServerForecasts(country_code, config.type, latest, config.limit, {
              force,
            });
            if (currentLoad.cancelled) return;

            if (serverForecasts.length > 0) {
              const { success, error } = await this.saveForecasts(serverForecasts);
              if (currentLoad.cancelled) return;
              if (error.length > 0) {
                console.error(error);
                throw new Error(`[Forecast] failed to load ${config.type} forecasts`);
              }
              config.signal.update((v) => {
                const seen = new Set<string>();
                return [...success, ...v]
                  .filter((doc) => {
                    if (seen.has(doc.id)) return false;
                    seen.add(doc.id);
                    return true;
                  })
                  .slice(0, config.limit);
              });
            }
          }),
        );

        // Location switch occurred while refresh was in flight - discard result
        if (currentLoad.cancelled) return;

        this.markSyncSuccess();
      }
    } catch (err) {
      console.error('[ForecastService] Error loading forecasts', err);
      if (!currentLoad.cancelled) {
        const offline = !this.isOnline() || !this.supabaseService.isAvailable();
        this.syncState.set(offline ? 'offline' : 'error');
        this.syncError.set(
          offline
            ? 'No internet connection. Showing previously downloaded forecasts.'
            : 'Could not check for new forecasts. Showing previously downloaded forecasts.',
        );
      }
    } finally {
      if (!currentLoad.cancelled) {
        this.loadingForecasts.set(false);
      }
    }
  }

  private async loadServerForecasts(
    country_code: CountryCodeLegacy,
    forecast_type: ForecastType,
    latest?: IForecast,
    limit = 3,
    options: ILoadOptions = {},
  ): Promise<IForecast[]> {
    await this.supabaseService.ready();
    if (!this.supabaseService.isAvailable()) {
      console.warn('[Forecast] Supabase server is not available, skipping loadServerForecasts');
      return [];
    }
    const table = this.supabaseService.db.table('forecasts');
    const query = table.select<'', IForecastRow>('').neq('storage_file', null).eq('forecast_type', forecast_type);

    if (country_code !== 'global') {
      query.eq('country_code', country_code);
    }

    // Incremental sync - only fetch records newer than the latest cached record.
    // Skipped during force refresh so all recent records are re-validated.
    if (latest && !options.force) {
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

    this.loadingDownscaled.set(true);

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
    } finally {
      if (!currentLoad.cancelled) {
        this.loadingDownscaled.set(false);
      }
    }
  }

  private async storeHardcodedData(forecasts: IForecastRow[] = []) {
    const { error, success } = await this.upsertPreservingAttachments(
      forecasts.map((forecast) => SERVER_DB_MAPPING(forecast)),
    );
    if (error.length > 0) {
      console.error('[ForecastService] error storing hardcoded forecasts', error);
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
    return await this.upsertPreservingAttachments(forecasts);
  }

  /**
   * Upsert forecast records whilst retaining any RxDB attachments already stored against the document, so that previously downloaded forecast files remain available offline.
   */
  private async upsertPreservingAttachments(forecasts: IForecast[]) {
    if (forecasts.length === 0) {
      return { success: [] as RxDocument<IForecast>[], error: [] as any[] };
    }
    const existingDocs = await this.dbCollection.findByIds(forecasts.map((f) => f.id)).exec();

    const merged = forecasts.map((forecast) => {
      const existing = existingDocs.get(forecast.id);
      if (!existing) return forecast;
      // `toJSON(true)` retains internal `_attachments` metadata required by rxdb
      const { _attachments } = existing.toJSON(true) as any;
      if (_attachments && Object.keys(_attachments).length > 0) {
        return { ...forecast, _attachments } as IForecast;
      }
      return forecast;
    });

    return await this.dbCollection.bulkUpsert(merged as any);
  }

  private markSyncSuccess() {
    const timestamp = new Date().toISOString();
    this.lastSyncedAt.set(timestamp);
    this.syncError.set(undefined);
    this.syncState.set('success');
    this.persistSyncTime(timestamp);
  }

  private readPersistedSyncTime(): string | undefined {
    try {
      return localStorage.getItem(this.LAST_SYNC_STORAGE_KEY) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  private persistSyncTime(timestamp: string) {
    try {
      localStorage.setItem(this.LAST_SYNC_STORAGE_KEY, timestamp);
    } catch (error) {
      console.warn('[ForecastService] unable to persist last sync time', error);
    }
  }

  private isOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  }
}
