import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
  viewChildren,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { CLIMATE_RESOURCES } from '@picsa/data/climate/resources';
import { LOCALES_DATA_HASHMAP } from '@picsa/data/deployments/locales';
import { getGeoLocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceItemLinkComponent } from '@picsa/resources/components/resource-item';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IResourceLink } from '@picsa/resources/schemas';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
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
  Refresh: translateMarker('Refresh'),
  RefreshForecasts: translateMarker('Refresh forecasts'),
  ForecastsUpToDate: translateMarker('Forecasts are up to date'),
  SelectLocation: translateMarker('Select Location'),
  LoadingForecasts: translateMarker('Loading forecasts...'),
  DownloadFailed: translateMarker('Could not download forecast. Check your connection and try again.'),
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

const FRESHNESS_THRESHOLD_MS = 12 * 60 * 60 * 1000;
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
export class ForecastComponent implements OnInit, AfterViewInit, OnDestroy {
  private service = inject(ForecastService);
  private configurationService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private notificationService = inject(PicsaNotificationService);
  private translateService = inject(PicsaTranslateService);
  private viewContainer = inject(ViewContainerRef);

  @ViewChild('headerCenterPortal') headerCenterPortal!: TemplateRef<unknown>;
  @ViewChild('headerEndPortal') headerEndPortal!: TemplateRef<unknown>;

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
    const location = this.locationSelected();
    const country = this.countryCode();
    if (!country || !location) return false;
    const geoData = getGeoLocationData(country as ICountryCode);
    if (geoData.admin_5) {
      return !!location[4] && !!location[5];
    }
    return !!location[4];
  });

  public selectedLocationLabel = computed(() => {
    const country = this.countryCode();
    const location = this.locationSelected();
    if (!country || !location) return undefined;
    const geoData = getGeoLocationData(country as ICountryCode);
    const admin4Id = location[4];
    const admin5Id = location[5];
    if (geoData.admin_5 && admin5Id) {
      const match = geoData.admin_5.locations.find((l) => l.id === admin5Id);
      if (match) return match.label;
    }
    if (admin4Id) {
      const match = geoData.admin_4.locations.find((l) => l.id === admin4Id);
      if (match) return match.label;
    }
    return undefined;
  });

  public locationOverlayOpen = signal(false);

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
  public toForecastType = (data: unknown) => data as IForecastSummary;
  public toCategory = (data: unknown) => data as IForecastCategory;

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  /** Categories are always rendered - each falls back to "No data available" */
  public shortTermCategories = computed<IForecastCategory[]>(() => [
    { id: 'daily', title: translateMarker('Daily'), forecasts: this.dailyForecasts(), loading: this.loading() },
    { id: 'weekly', title: translateMarker('Weekly'), forecasts: this.weeklyForecasts(), loading: this.loading() },
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

  public isCheckedWithin12Hours = computed(() => {
    const last = this.service.lastSyncedAt();
    if (!last) return false;
    return Date.now() - new Date(last).getTime() < FRESHNESS_THRESHOLD_MS;
  });

  public showOfflineBadge = computed(() => {
    const notCheckedIn12Hours = !this.isCheckedWithin12Hours();
    const isOffline = !this.isOnline() || this.service.syncState() === 'offline';
    return notCheckedIn12Hours && isOffline;
  });

  private isOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  }

  constructor() {
    effect(() => {
      const { location } = this.configurationService.userSettings();
      this.service.setForecastLocation(location);
    });

    // Auto-open location overlay if location is not set when entering tool
    effect(() => {
      const ready = this.locationReady();
      if (!ready) {
        this.locationOverlayOpen.set(true);
      }
    });
  }

  public hasRefreshedSuccessfully = signal(false);
  public isManualRefreshing = signal(false);
  public isRefreshing = computed(() => this.isManualRefreshing() || this.service.isForceRefreshing());

  ngOnInit() {
    // Subtly check for updates when entering the page if not checked within 12 hours
    if (this.locationReady() && !this.isCheckedWithin12Hours()) {
      this.executeRefreshWithMinTime().then((success) => {
        if (success) {
          this.hasRefreshedSuccessfully.set(true);
        }
      });
    }
  }

  private async executeRefreshWithMinTime(): Promise<boolean> {
    const MIN_REFRESH_TIME_MS = 800;
    const startTime = Date.now();
    this.isManualRefreshing.set(true);

    try {
      await this.service.forceRefresh();
    } catch (err) {
      console.error('[Forecast] refresh error', err);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_REFRESH_TIME_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_TIME_MS - elapsed));
      }
      this.isManualRefreshing.set(false);
    }

    return this.service.syncState() !== 'error' && this.service.syncState() !== 'offline';
  }

  ngAfterViewInit() {
    this.componentsService.patchHeader({
      cdkPortalCenter: new TemplatePortal(this.headerCenterPortal, this.viewContainer),
      cdkPortalEnd: new TemplatePortal(this.headerEndPortal, this.viewContainer),
    });
  }

  public handleLocationConfirmed(location: (string | undefined)[]): void {
    this.hasRefreshedSuccessfully.set(false);
    this.configurationService.updateUserSettings({ location });
    this.locationOverlayOpen.set(false);
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({
      cdkPortalCenter: undefined,
      cdkPortalEnd: undefined,
    });
    this.service.setForecastLocation(undefined);
  }

  public async handleForceRefresh() {
    if (this.isRefreshing() || this.hasRefreshedSuccessfully()) return;
    const success = await this.executeRefreshWithMinTime();
    if (success) {
      this.hasRefreshedSuccessfully.set(true);
    }
  }

  public async handleForecastClick(forecast: IForecastSummary) {
    // open already-downloaded forecasts directly (fully offline)
    if (forecast.downloaded) {
      this.openForecast(forecast);
      return;
    }
    // download and open new forecasts (requires connection)
    const downloader = this.downloaders().find((d) => d.storage_path() === forecast.storage_file);
    if (!downloader) return;
    try {
      await this.service.downloadForecastFile(forecast._doc, downloader);
    } catch (err) {
      console.error('[Forecast] download failed', err);
      const message = this.translateService.instant(STRINGS.DownloadFailed);
      this.notificationService.showErrorNotification(message);
      return;
    }
    forecast._doc = forecast._doc.getLatest();
    if (forecast._doc.getAttachment(forecast.storage_file)) {
      this.openForecast(forecast);
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
