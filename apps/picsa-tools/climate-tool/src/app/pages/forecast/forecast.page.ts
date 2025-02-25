import { CommonModule } from '@angular/common';
import { Component, computed, effect, OnDestroy, signal, viewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfigurationService } from '@picsa/configuration';
import { ICountryCode } from '@picsa/data';
import { GEO_LOCATION_DATA } from '@picsa/data/geoLocation';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { RxDocument } from 'rxdb';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateForecastService } from './forecast.service';
import { IClimateForecast } from './schemas';

interface IForecastSummary {
  _doc: RxDocument<IClimateForecast>;
  id: string;
  label: string;
  storage_file: string;
  downloaded: boolean;
  type: string;
}

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    MatIcon,
    MatProgressBarModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    ResourcesComponentsModule,
    SupabaseStorageDownloadComponent,
  ],
})
export class ClimateForecastComponent implements OnDestroy {
  public pdfSrc?: string;

  /** Options provided to location select (admin_4 district/province level) */
  public locationSelectOptions = signal<{ id: string; label: string }[]>([]);

  /** Label used for location select (admin_4 district/province level) */
  public locationSelectLabel = signal('');

  /** Location selected as stored to user profile (admin_4 district/province level) */
  public locationSelected = computed(
    () => this.configurationService.userSettings().location[4] || this.locationSelectOptions()[0]?.id
  );

  public dailyForecasts = computed(() =>
    this.service.dailyForecastDocs().map((doc): IForecastSummary => {
      const { id, storage_file, forecast_type } = doc;
      const label = this.generateForecastLabel(id);
      const summary: IForecastSummary = {
        _doc: doc,
        id,
        label,
        storage_file: storage_file as string,
        downloaded: false,
        type: forecast_type || '',
      };
      if (storage_file) {
        summary.downloaded = doc.getAttachment(storage_file) ? true : false;
      }
      return summary;
    })
  );

  public downscaledForecast = signal<IForecastSummary | undefined>(undefined);

  public seasonalForecast = signal<IForecastSummary | undefined>(undefined);

  // Utility to add type-safety to implicit ng-template data
  public toForecastType = (data: any) => data as IForecastSummary;

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  constructor(
    private service: ClimateForecastService,
    private configurationService: ConfigurationService,
    private dbAttachmentService: PicsaDatabaseAttachmentService
  ) {
    effect(() => {
      const { location } = this.configurationService.userSettings();
      console.log('load location data', location);
      if (location) {
        const country_code = location[2] as ICountryCode;
        this.service.loadForecasts(country_code);
        const geoLocationData = GEO_LOCATION_DATA[country_code];
        this.locationSelectOptions.set(geoLocationData?.admin_4.locations || []);
        this.locationSelectLabel.set(geoLocationData?.admin_4.label || '');
      }
    });

    effect(() => {
      const location = this.locationSelected();
      if (location) {
        console.log('loading downscaled forecast', location);
        // TODO - load downscaled forecast for location
      }
    });
  }

  ngOnDestroy() {
    this.closeForecast();
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
          // refresh data to populated downloads
          this.refreshForecastData();
        }
      }
    }
  }

  /** When user district/province selected store to user profile location data */
  public handleUserLocationSelect(admin_4_location: string) {
    const update = [...this.configurationService.userSettings().location];
    update[4] = admin_4_location;
    this.configurationService.updateUserSettings({ location: update });
  }

  public closeForecast() {
    if (this.pdfSrc) {
      URL.revokeObjectURL(this.pdfSrc);
    }
    this.pdfSrc = undefined;
  }

  private refreshForecastData() {
    const { country_code } = this.configurationService.deploymentSettings();
    return this.service.loadForecasts(country_code);
  }

  private async openForecast(forecast: IForecastSummary) {
    const uri = await this.dbAttachmentService.getFileAttachmentURI(forecast._doc, forecast.storage_file as string);
    this.pdfSrc = uri || undefined;
  }

  private generateForecastLabel(id: string) {
    const [timestamp, filename] = id.split('/');
    if (filename) {
      const [basename, extension] = filename.split('.');
      return basename.replace(/-/g, ' ');
    }
    return id;
  }
}
