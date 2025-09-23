import { CommonModule } from '@angular/common';
import { Component, computed, effect, OnDestroy, signal, viewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ConfigurationService } from '@picsa/configuration/src';
import { CLIMATE_RESOURCES } from '@picsa/data/climate/resources';
import { LOCALES_DATA_HASHMAP } from '@picsa/data/deployments/locales';
import { PicsaFormsModule } from '@picsa/forms';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceItemLinkComponent } from '@picsa/resources/components/resource-item';
import type { IResourceLink } from '@picsa/resources/schemas';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { isEqual } from '@picsa/utils/object.utils';
import { RxDocument } from 'rxdb';

import { ForecastViewerComponent } from '../../components/forecast-viewer/forecast-viewer.component';
import { IForecast } from '../../schemas';
import { ForecastService } from '../../services/forecast.service';

const STRINGS = { National: translateMarker('National') };

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

@Component({
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ForecastViewerComponent,
    MatIcon,
    MatProgressBarModule,
    PicsaFormsModule,
    PicsaTranslateModule,
    ResourceItemLinkComponent,
    SupabaseStorageDownloadComponent,
  ],
})
export class ForecastComponent implements OnDestroy {
  /** Forecast summary for display in forecast-viewer component */
  public viewerForecast = signal<IForecastSummary | undefined>(undefined);
  public viewerOpen = signal(false);

  public countryCode = computed(() => this.configurationService.userSettings().country_code);
  public locationSelected = computed(() => this.configurationService.userSettings().location, { equal: isEqual });

  public dailyForecasts = computed(() => this.generateForecastSummary(this.service.dailyForecastDocs()));
  public weeklyForecasts = computed(() => this.generateForecastSummary(this.service.weeklyForecastDocs()));
  public downscaledForecasts = computed(() => this.generateForecastSummary(this.service.downscaledForecastDocs()));
  public seasonalForecasts = computed(() => this.generateForecastSummary(this.service.seasonalForecastDocs()));

  public resourceLinks = computed<IResourceLink[]>(() => {
    const { country_code } = this.configurationService.userSettings();
    return CLIMATE_RESOURCES[country_code] || [];
  });

  // Utility to add type-safety to implicit ng-template data
  public toForecastType = (data: any) => data as IForecastSummary;

  public FORECAST_HEADINGS = {};

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  constructor(
    private service: ForecastService,
    private configurationService: ConfigurationService,
  ) {
    effect(() => {
      const { location } = configurationService.userSettings();
      service.setForecastLocation(location);
    });
  }

  ngOnDestroy() {
    this.service.setForecastLocation(undefined);
  }

  public handleLocationUpdate(location: (string | undefined)[]) {
    this.configurationService.updateUserSettings({ location });
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
        label = doc.label || this.generateForecastLabel(storage_file);
      } else {
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

  private generateForecastLabel(storage_file: string) {
    const filename = storage_file.split('/').pop();
    if (filename) {
      const [basename, extension] = filename.split('.');
      return basename.replace(/[-_]/g, ' ');
    }
    return storage_file;
  }
}
