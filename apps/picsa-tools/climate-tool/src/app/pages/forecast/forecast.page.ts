import { CommonModule } from '@angular/common';
import { Component, computed, effect, OnDestroy, signal, viewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfigurationService } from '@picsa/configuration';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
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

  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  public dailyForecasts = computed(() =>
    this.service.dailyForecastDocs().map((doc): IForecastSummary => {
      const { id, storage_file } = doc;
      const label = this.generateForecastLabel(id);
      const summary: IForecastSummary = {
        _doc: doc,
        id,
        label,
        storage_file: storage_file as string,
        downloaded: false,
      };
      if (storage_file) {
        summary.downloaded = doc.getAttachment(storage_file) ? true : false;
      }
      return summary;
    })
  );

  public downscaledForecasts = computed(() => {
    const collection = this.service.downscaledForecastsCollection();
    if (collection) {
      return collection._data;
    }
    return undefined;
  });

  // HACK - use resources collection for downscaled forecasts
  public downscaledForecastsCollection = {};

  constructor(private service: ClimateForecastService, private configurationService: ConfigurationService) {
    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      if (country_code) {
        this.service.loadForecasts(country_code);
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
        // refresh data to populated downloads
        await this.refreshForecastData();
        const updated = this.dailyForecasts().find(({ id }) => id === forecast.id);
        if (updated?.downloaded) {
          this.openForecast(updated);
        }
      }
    }
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
    const attachment = forecast._doc.getAttachment(forecast.storage_file as string);
    if (!attachment) {
      throw new Error('Forecast file not found');
    }
    const blob = await attachment.getData();
    // TODO - handle html (maybe general file-viewer component)
    const uri = URL.createObjectURL(blob);
    this.pdfSrc = uri;
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
