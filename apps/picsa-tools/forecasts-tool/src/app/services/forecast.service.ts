import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { IUserSettings } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { FORECASTS_DB, type IForecastBundleRow } from '@picsa/data/climate/forecasts';
import { ENVIRONMENT } from '@picsa/environments';
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

/**
 * Stub fallback forecasts carry ids prefixed with `stub/` - they are generated
 * locally, never synced from the server, and must never render while bypassing.
 * Exported so the display layer can enforce the bypass guarantee regardless of
 * what the local cache holds.
 */
export function isStubForecast(doc?: IForecast | RxDocument<IForecast>): boolean {
  return !!doc?.id?.startsWith('stub/');
}

/**
 * Display rule for synced forecasts: a doc is shown only while it has a downloadable file.
 * Retired (tombstoned) rows carry storage_file null and are excluded here, never by count
 * limits - row counts multiply by translated versions so caps would silently drop languages.
 * Exported for unit testing alongside isStubForecast.
 */
export const isLiveForecast = (doc: Pick<IForecast, 'storage_file'>) => !!doc.storage_file;

interface LoaderConfig {
  type: ForecastType;
  signal: WritableSignal<RxDocument<IForecast>[]>;
  limit?: number;
  includeStorage?: boolean;
}

/** Exported for unit testing the bypass matrix without booting the service */
export function shouldUseBypassStubs(): boolean {
  if (ENVIRONMENT.production) return true;
  const search = window?.location?.search;
  if (!search) return false;
  for (const [key, val] of new URLSearchParams(search).entries()) {
    if (key.toLowerCase() === 'bypassstubs') {
      return val.toLowerCase() === 'true' || val === '';
    }
  }
  return false;
}

@Injectable({ providedIn: 'root' })
export class ForecastService extends PicsaAsyncService {
  private supabaseService = inject(SupabaseService);
  private dbService = inject(PicsaDatabase_V2_Service);
  private dbAttachmentService = inject(PicsaDatabaseAttachmentService);

  public enabled = signal(false);

  /** True in production or via ?bypassStubs flag. Evaluated live (not cached at
   * construction) so client-side navigations pick up flag changes without a reload */
  public get bypassStubs(): boolean {
    return shouldUseBypassStubs();
  }

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

  private loaderConfigs: LoaderConfig[] = [
    // TODO - limit not very useful, can have multiple translated versions
    //        Should try move to time-based filter/query instead, or better table replication
    // Seasonal and downscaled sync the full set for the scope; tombstoned rows are
    // excluded client-side via isLiveForecast (no count limits so translations are never dropped)
    { type: 'seasonal', signal: this.seasonalForecastDocs, includeStorage: true },
    { type: 'downscaled', signal: this.downscaledForecastDocs },
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

  private getStubId(country_code: string, forecast_type: IForecast['forecast_type']): string {
    return `stub/${forecast_type}/${country_code}`;
  }

  private async loadForecastsForCountry(country_code: ICountryCode) {
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
          let cached = await this.loadCachedForecasts(country_code, config.type, config.limit);
          // If seasonal has no cached data (e.g. fresh install / offline), seed from bundled FORECASTS_DB
          if (config.type === 'seasonal' && cached.length === 0) {
            const hardcoded = FORECASTS_DB.filter(
              (v) => v.country_code === country_code && v.forecast_type === 'seasonal',
            );
            if (hardcoded.length > 0) {
              cached = await this.storeHardcodedData(hardcoded);
            }
          }
          return { config, data: cached };
        }),
      );

      if (currentLoad.cancelled) return;

      // 2. Set the cached data to signals immediately (tombstoned rows excluded)
      for (const { config, data } of cachedData) {
        config.signal.set(data.filter(isLiveForecast));
      }

      // 3. Now start loading from server (which might take time)
      const serverConfigs = countryConfigs.filter((c) => c.includeStorage);
      if (serverConfigs.length > 0) {
        this.loadingForecasts.set(true);

        await Promise.all(
          serverConfigs.map(async (config) => {
            const cached = config.signal();
            const { limit } = config;
            // Only pass latest for daily/weekly where IDs are chronological date-based strings (excluding stubs)
            const latestDoc =
              (config.type === 'daily' || config.type === 'weekly') && cached[0] && !isStubForecast(cached[0])
                ? cached[0]
                : undefined;
            let serverForecasts = await this.loadServerForecasts(country_code, config.type, latestDoc, limit);
            if (currentLoad.cancelled) return;

            const hasRealCache = cached.some((doc) => !isStubForecast(doc));
            // When testing locally / offline, if server returns no records and no cached records exist,
            // provide stub daily/weekly forecasts unless explicitly bypassed via ?bypassStubs=true (or in production)
            if (serverForecasts.length === 0 && !hasRealCache && !this.bypassStubs) {
              serverForecasts = this.getStubForecasts(country_code, config.type);
            }

            if (serverForecasts.length > 0) {
              const isStub = isStubForecast(serverForecasts[0]);
              // If real server forecasts arrived, purge any stubs from RxDB
              if (!isStub) {
                const stubId = this.getStubId(country_code, config.type);
                await this.dbCollection.bulkRemove([stubId]);
              }

              const { success, error } = await this.saveForecasts(serverForecasts);
              if (currentLoad.cancelled) return;
              if (error.length > 0) {
                console.error(error);
                throw new Error(`[Forecast] failed to load ${config.type} forecasts`);
              }
              config.signal.update((v) => {
                const filtered = !isStub ? v.filter((doc) => !isStubForecast(doc)) : v;
                const seen = new Set<string>();
                const merged = [...success, ...filtered].filter((doc) => {
                  if (seen.has(doc.id)) return false;
                  seen.add(doc.id);
                  return true;
                });
                const live = merged.filter(isLiveForecast);
                return limit !== undefined ? live.slice(0, limit) : live;
              });
            }
          }),
        );
        // Purge seasonal docs retired server-side (tombstoned) and drop them from view.
        // Reconcile runs pull-only as bulkUpsert never deletes; offline devices clear on next online sync.
        if (!currentLoad.cancelled) {
          const removedIds = await this.reconcileForecastTombstones({ country_code, forecast_type: 'seasonal' });
          if (!currentLoad.cancelled && removedIds.length > 0) {
            const removed = new Set(removedIds);
            this.seasonalForecastDocs.update((docs) =>
              docs.filter((doc) => !removed.has(doc.id) && isLiveForecast(doc)),
            );
          }
        }
      }
    } catch (err) {
      console.error('[ForecastService] Error loading forecasts', err);
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
    limit?: number,
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

    const orderedQuery = query.order('id', { ascending: false });
    // No limit syncs the full set (seasonal/downscaled span translated versions that caps would drop)
    if (limit !== undefined) {
      orderedQuery.limit(limit);
    }

    const { data, error } = await orderedQuery;

    if (error) {
      console.error(error);
      throw error;
    }

    return (data || []).map((el) => SERVER_DB_MAPPING(el));
  }

  private async loadDownscaledForecasts(country_code: CountryCodeLegacy, admin_4: string, admin_5?: string) {
    const locationKey = `${country_code}||${admin_4}||${admin_5 || ''}`;
    if (this.activeDownscaledLoad) {
      this.activeDownscaledLoad.cancelled = true;
    }
    const currentLoad = { locationKey, cancelled: false };
    this.activeDownscaledLoad = currentLoad;

    this.loadingDownscaled.set(true);

    try {
      // 1. Load cached downscaled forecasts first (offline-first)
      let cached = await this.loadCachedDownscaledForecasts(country_code, admin_4, admin_5);

      // If empty (fresh install / offline), seed from bundled FORECASTS_DB
      if (cached.length === 0) {
        const filters: ((v: IForecastBundleRow) => boolean)[] = [
          (v) => v.forecast_type === 'downscaled',
          (v) => v.country_code === country_code,
          (v) => (admin_5 && v.downscaled_location === admin_5) || v.downscaled_location === admin_4,
        ];
        const hardcoded = FORECASTS_DB.filter((v) => filters.every((fn) => fn(v)));
        if (hardcoded.length > 0) {
          cached = await this.storeHardcodedData(hardcoded);
        }
      }

      if (currentLoad.cancelled) return;
      this.downscaledForecastDocs.set(cached.filter(isLiveForecast));

      // 2. Fetch latest from server if online
      const serverForecasts = await this.loadServerDownscaledForecasts(country_code, admin_4, admin_5);
      if (currentLoad.cancelled) return;

      if (serverForecasts.length > 0) {
        const { success } = await this.saveForecasts(serverForecasts);
        if (currentLoad.cancelled) return;
        if (success.length > 0) {
          this.downscaledForecastDocs.set(success);
        }
      }
      // Purge docs retired server-side (tombstoned) and drop them from view.
      // Locations without a current-season forecast correctly show nothing instead of stale rows.
      const removedIds = await this.reconcileForecastTombstones({
        country_code,
        forecast_type: 'downscaled',
        downscaled_location: admin_5 ? [admin_4, admin_5] : [admin_4],
      });
      if (currentLoad.cancelled) return;
      if (removedIds.length > 0) {
        const removed = new Set(removedIds);
        this.downscaledForecastDocs.update((docs) => docs.filter((doc) => !removed.has(doc.id) && isLiveForecast(doc)));
      }
    } catch (err) {
      console.error('[ForecastService] Error loading downscaled forecasts', err);
    } finally {
      if (!currentLoad.cancelled) {
        this.loadingDownscaled.set(false);
      }
    }
  }

  /**
   * Remove local forecast docs retired on the server via storage_file tombstones.
   * Forecasts sync pull-only via bulkUpsert which never deletes, so tombstoned rows
   * (including downloaded attachments) must be removed explicitly.
   * Only ids positively present server-side with a null file are removed: mere absence
   * from a server response never deletes, as empty dev databases would otherwise
   * cannibalise valid bundle-seeded docs on every load.
   * Only runs after a successful server response - never wipes on offline/error.
   * @returns ids removed from the local collection
   */
  private async reconcileForecastTombstones(scope: {
    country_code: ICountryCode;
    forecast_type: ForecastType;
    downscaled_location?: string[];
  }): Promise<string[]> {
    await this.supabaseService.ready();
    if (!this.supabaseService.isAvailable()) return [];
    const { country_code, forecast_type, downscaled_location } = scope;
    const table = this.supabaseService.db.table('forecasts');
    const query = table
      .select<'id,storage_file', Pick<IForecastRow, 'id' | 'storage_file'>>('id,storage_file')
      .eq('forecast_type', forecast_type);
    if (country_code !== 'global') {
      query.eq('country_code', country_code);
    }
    if (downscaled_location) {
      query.in('downscaled_location', downscaled_location);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[Forecast] tombstone reconcile failed, keeping local docs', error);
      return [];
    }
    const serverRows = data || [];
    const selector: MangoQuerySelector<IForecast> = { forecast_type };
    if (country_code !== 'global') {
      selector.country_code = country_code;
    }
    if (downscaled_location) {
      selector.downscaled_location =
        downscaled_location.length > 1 ? { $in: downscaled_location } : downscaled_location[0];
    }
    const cached = await this.dbCollection.find({ selector }).exec();
    const cachedIds = new Set(cached.map((doc) => doc.id));
    // Tombstone-only: absence from the server response never deletes (empty dev
    // databases and scoped queries would otherwise purge valid bundle-seeded docs)
    const removeIds = serverRows
      .filter((row) => row.storage_file === null && cachedIds.has(row.id))
      .map((row) => row.id);
    if (removeIds.length > 0) {
      await this.dbCollection.bulkRemove(removeIds);
    }
    return removeIds;
  }

  private async loadCachedDownscaledForecasts(country_code: CountryCodeLegacy, admin_4: string, admin_5?: string) {
    const selector: MangoQuerySelector<IForecast> = {
      forecast_type: 'downscaled',
      country_code,
      downscaled_location: admin_5 ? { $in: [admin_4, admin_5] } : admin_4,
    };
    return await this.dbCollection.find({ selector, sort: [{ id: 'desc' }] }).exec();
  }

  private async loadServerDownscaledForecasts(country_code: CountryCodeLegacy, admin_4: string, admin_5?: string) {
    await this.supabaseService.ready();
    if (!this.supabaseService.isAvailable()) {
      return [];
    }
    const table = this.supabaseService.db.table('forecasts');
    const query = table
      .select<'*', IForecastRow>('*')
      .neq('storage_file', null)
      .eq('forecast_type', 'downscaled')
      .eq('country_code', country_code);

    if (admin_5) {
      query.in('downscaled_location', [admin_4, admin_5]);
    } else {
      query.eq('downscaled_location', admin_4);
    }

    const { data, error } = await query.order('id', { ascending: false });
    if (error) {
      console.error('[Forecast] Error loading server downscaled forecasts', error);
      return [];
    }
    return (data || []).map((el) => SERVER_DB_MAPPING(el));
  }

  private async storeHardcodedData(forecasts: IForecastBundleRow[] = []) {
    const { error, success } = await this.dbCollection.bulkUpsert(
      forecasts.map((forecast) => SERVER_DB_MAPPING(forecast)),
    );

    if (error.length > 0) {
      console.error('forecast store error', error);
      return [];
    }

    return success;
  }

  private async loadCachedForecasts(country_code: string, forecast_type: IForecast['forecast_type'], limit?: number) {
    const selector: MangoQuerySelector<IForecast> = { forecast_type };

    if (country_code !== 'global') {
      selector.country_code = country_code;
    }

    // Query with a small buffer (limit + 1) to account for potential stub document while keeping read bounded
    const queryLimit = limit !== undefined ? limit + 1 : undefined;
    const docs = await this.dbCollection
      .find({ selector, sort: [{ id: 'desc' }], ...(queryLimit !== undefined ? { limit: queryLimit } : {}) })
      .exec();
    const realDocs = docs.filter((d) => !isStubForecast(d));
    const stubDocs = docs.filter((d) => isStubForecast(d));

    // If bypassing stubs or real cached forecasts exist, purge any stubs from RxDB
    if (this.bypassStubs || realDocs.length > 0) {
      if (stubDocs.length > 0) {
        await this.dbCollection.bulkRemove(stubDocs.map((d) => d.id));
      } else {
        const stubId = this.getStubId(country_code, forecast_type);
        await this.dbCollection.bulkRemove([stubId]);
      }
      return limit !== undefined ? realDocs.slice(0, limit) : realDocs;
    }

    return limit !== undefined ? docs.slice(0, limit) : docs;
  }

  private async saveForecasts(forecasts: IForecast[]) {
    return await this.dbCollection.bulkUpsert(forecasts);
  }

  private getStubForecasts(country_code: CountryCodeLegacy, forecast_type: ForecastType): IForecast[] {
    const today = new Date().toISOString().slice(0, 10);
    if (forecast_type === 'daily') {
      return [
        {
          id: this.getStubId(country_code, 'daily'),
          country_code,
          forecast_type: 'daily',
          label: `Daily Weather Forecast (${today})`,
          language_code: 'en',
          storage_file: 'global/forecasts/sample_daily.pdf',
          mimetype: 'application/pdf',
          downscaled_location: null,
        },
      ];
    }
    if (forecast_type === 'weekly') {
      return [
        {
          id: this.getStubId(country_code, 'weekly'),
          country_code,
          forecast_type: 'weekly',
          label: `7-Day Weather Outlook (${today})`,
          language_code: 'en',
          storage_file: 'global/forecasts/sample_weekly.html',
          mimetype: 'text/html',
          downscaled_location: null,
        },
      ];
    }
    return [];
  }
}
