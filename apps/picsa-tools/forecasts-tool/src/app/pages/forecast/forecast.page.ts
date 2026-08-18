import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { CLIMATE_RESOURCES } from '@picsa/data/climate/resources';
import { LOCALES_DATA_HASHMAP } from '@picsa/data/deployments/locales';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceItemLinkComponent } from '@picsa/resources/components/resource-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IResourceLink } from '@picsa/resources/schemas';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { RxDocument } from 'rxdb';

import { ForecastViewerComponent } from '../../components/forecast-viewer/forecast-viewer.component';
import { IForecast } from '../../schemas';
import { ForecastService } from '../../services/forecast.service';

const STRINGS = {
  National: translateMarker('National'),
  NoData: translateMarker('No data available'),
  UpToDate: translateMarker('Up to date'),
  Stale: translateMarker('Stale data'),
  Checking: translateMarker('Checking for updates…'),
  Offline: translateMarker('Offline - showing saved forecasts'),
  Error: translateMarker('Could not check for updates'),
  NeverSynced: translateMarker('No data Available'),
};

interface IForecastSummary {
  _doc: RxDocument<IForecast>;
  id: string;
  type: string | null;
  title: string;
  label?: string;
  image?: string;
  storage_file: string;
  downloaded: boolean;
  languageLabel?: string;
}

interface IForecastCategory {
  id: string;
  title: string;
  forecasts: IForecastSummary[];
  loading: boolean;
}

interface ISyncStatus {
  state: 'idle' | 'updating' | 'success' | 'stale' | 'offline' | 'error';
  icon: string;
  label: string;
  /** e.g. `Last checked: 2 hours ago` */
  detail?: string;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ForecastViewerComponent,
    MatButtonModule,
    MatIcon,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    PicsaFormsModule,
    PicsaTranslateModule,
    ResourceItemLinkComponent,
    SupabaseStorageDownloadComponent,
  ],
})
export class ForecastComponent implements OnDestroy {
  private service = inject(ForecastService);
  private configurationService = inject(ConfigurationService);
  private snackbar = inject(MatSnackBar);

  /** Forecast summary for display in forecast-viewer component */
  public viewerForecast = signal<IForecastSummary | undefined>(undefined);
  public viewerOpen = signal(false);

  public countryCode = computed(() => this.configurationService.userSettings().country_code);
  public locationSelected = computed(() => this.configurationService.userSettings().location, { equal: isEqual });

  public dailyForecasts = computed(() => this.generateForecastSummary(this.service.dailyForecastDocs()));
  public weeklyForecasts = computed(() => this.generateForecastSummary(this.service.weeklyForecastDocs()));
  public downscaledForecasts = computed(() => this.generateForecastSummary(this.service.downscaledForecastDocs()));
  public seasonalForecasts = computed(() => this.generateForecastSummary(this.service.seasonalForecastDocs()));

  public locationReady = computed(() => {
    const location = this.locationSelected() || [];
    return !!location[2] && !!location[4];
  });

  public loading = computed(() => this.service.loadingForecasts());
  public loadingDownscaled = computed(() => this.service.loadingDownscaled());

  // Activity that should render the animated spinner
  public refreshing = computed(() => this.service.isForceRefreshing());
  public syncing = computed(() => this.loading() || this.loadingDownscaled() || this.refreshing());

  public resourceLinks = computed<IResourceLink[]>(() => {
    const { country_code } = this.configurationService.userSettings();
    return CLIMATE_RESOURCES[country_code] || [];
  });

  // Utility to add type-safety to implicit ng-template data
  public toForecastType = (data: any) => data as IForecastSummary;
  public toCategory = (data: any) => data as IForecastCategory;

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  /** Categories are always rendered - each falls back to "No data available" */
  public shortTermCategories = computed<IForecastCategory[]>(() => [
    { id: 'weekly', title: translateMarker('Weekly'), forecasts: this.weeklyForecasts(), loading: this.loading() },
    { id: 'daily', title: translateMarker('Daily'), forecasts: this.dailyForecasts(), loading: this.loading() },
  ]);

  public seasonalCategories = computed<IForecastCategory[]>(() => [
    {
      id: 'downscaled',
      title: translateMarker('Downscaled'),
      forecasts: this.downscaledForecasts(),
      loading: this.loadingDownscaled(),
    },
    {
      id: 'seasonal',
      title: translateMarker('National'),
      forecasts: this.seasonalForecasts(),
      loading: this.loading(),
    },
  ]);

  /** Ticking clock used to keep relative "x hours ago" labels fresh */
  private now = signal(Date.now());
  private nowInterval = setInterval(() => this.now.set(Date.now()), 30_000);

  public syncStatus = computed<ISyncStatus>(() => {
    const state = this.service.syncState();
    const lastSyncedAt = this.service.lastSyncedAt();
    const now = this.now();

    const detail = lastSyncedAt
      ? `${translateMarker('Last checked')}: ${formatRelativeTime(new Date(lastSyncedAt).getTime(), now)}`
      : STRINGS.NeverSynced;

    if (this.syncing()) {
      return { state: 'updating', icon: 'sync', label: STRINGS.Checking, detail };
    }
    if (state === 'offline') {
      return { state: 'offline', icon: 'cloud_off', label: STRINGS.Offline };
    }
    if (state === 'error') {
      return { state: 'error', icon: 'error_outline', label: STRINGS.Error };
    }
    const isStale = !lastSyncedAt || now - new Date(lastSyncedAt).getTime() > STALE_THRESHOLD_MS;
    return isStale
      ? { state: 'stale', icon: 'schedule', label: STRINGS.Stale, detail }
      : { state: 'success', icon: 'cloud_done', label: STRINGS.UpToDate, detail };
  });

  /** Inline banner message shown when a refresh fails (cached data is retained) */
  public syncErrorMessage = computed(() => (this.syncing() ? undefined : this.service.syncError()));

  /** Track last notified error to avoid duplicate toasts */
  private lastNotifiedError?: string;

  constructor() {
    effect(() => {
      const { location } = this.configurationService.userSettings();
      this.service.setForecastLocation(location);
    });
    // Toast feedback for offline/error sync states (data remains cached)
    effect(() => {
      const state = this.service.syncState();
      const message = this.service.syncError();
      untracked(() => {
        if ((state === 'offline' || state === 'error') && message && message !== this.lastNotifiedError) {
          this.lastNotifiedError = message;
          this.snackbar.open(message, undefined, { duration: 4000, panelClass: 'forecast-sync-snackbar' });
        }
        if (state === 'success') {
          this.lastNotifiedError = undefined;
        }
      });
    });
  }

  ngOnDestroy() {
    this.service.setForecastLocation(undefined);
  }

  public handleLocationUpdate(location: (string | undefined)[]) {
    this.configurationService.updateUserSettings({ location });
  }

  public async handleForceRefresh() {
    await this.service.forceRefresh();
  }

  public async handleForecastClick(forecast: IForecastSummary) {
    // open downloaded forecast
    if (forecast.downloaded) {
      this.openForecast(forecast);
    }
    // download and open new forecast
    else {
      const downloader = this.downloaders().find((d) => d.storage_path() === forecast.storage_file);
      if (downloader) {
        await this.service.downloadForecastFile(forecast._doc, downloader);
        forecast._doc = forecast._doc.getLatest();
        if (forecast._doc.getAttachment(forecast.storage_file)) {
          this.openForecast(forecast);
        }
      }
    }
  }

  private openForecast(forecast: IForecastSummary) {
    this.viewerForecast.set(forecast);
    this.viewerOpen.set(true);
  }

  private generateForecastSummary(docs: RxDocument<IForecast>[]): IForecastSummary[] {
    const summaries = docs.map((doc) => {
      const { id, storage_file, forecast_type, language_code } = doc;
      // rename seasonal forecast title to say 'national' instead
      const title = forecast_type === 'seasonal' ? STRINGS.National : (forecast_type as string);
      const languageLabel = LOCALES_DATA_HASHMAP[language_code || '']?.language_label;

      // only include filename label for daily forecast, use image for seasonal and downscaled
      let label: string | undefined = undefined;
      let image: string | undefined = undefined;
      if (forecast_type === 'daily' || forecast_type === 'weekly') {
        label = this.generateForecastLabel(doc);
      } else {
        // allow label and image on seasonal/downscaled
        label = doc.label || undefined;
        image = `assets/svgs/forecast_${forecast_type}.svg`;
      }

      const summary: IForecastSummary = {
        _doc: doc,
        id,
        label,
        storage_file: storage_file as string,
        downloaded: false,
        title,
        type: forecast_type,
        image,
        languageLabel,
      };
      if (storage_file) {
        summary.downloaded = doc.getAttachment(storage_file) ? true : false;
      }
      return summary;
    });
    return summaries;
  }

  private generateForecastLabel(forecast: IForecast) {
    const { country_code, label, storage_file } = forecast;
    // HACK - mw sender subject label not well formatted, prefer using storage file
    if (country_code === 'mw') {
      return storageFileToLabel(storage_file);
    }
    if (label) return label;
    return storageFileToLabel(storage_file);
  }
}
function storageFileToLabel(storage_file: string) {
  const filename = storage_file.split('/').pop();
  if (filename) {
    const [basename] = filename.split('.');
    return basename.replace(/[-_]/g, ' ');
  }
  return storage_file;
}

function formatRelativeTime(from: number, now: number) {
  const diff = Math.max(0, now - from);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
