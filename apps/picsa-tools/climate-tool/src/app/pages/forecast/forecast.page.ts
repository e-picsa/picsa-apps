import { CommonModule } from '@angular/common';
import { Component, computed, effect, OnDestroy, signal, viewChildren } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { IResourceFile } from '@picsa/resources/src/app/schemas';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { RxDocument } from 'rxdb';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';
import { ClimateForecastService } from './forecast.service';
import { IClimateForecastRow } from './forecast.types';

interface IForecastSummary {
  _doc: RxDocument<IClimateForecastRow>;
  id: string;
  label: string;
  downloaded: boolean;
  storage_file: string | null;
}

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    ResourcesComponentsModule,
    SupabaseStorageDownloadComponent,
  ],
})
export class ClimateForecastComponent implements OnDestroy {
  forecastTypes = ['Annual', 'Downscaled'];
  public pdfSrc?: string;

  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  public dailyForecasts = computed(() =>
    this.service.dailyForecastDocs().map((doc): IForecastSummary => {
      const { id, storage_file } = doc;
      const label = this.generateForecastLabel(id);
      const summary: IForecastSummary = { _doc: doc, id, label, storage_file, downloaded: false };
      if (storage_file) {
        summary.downloaded = doc.getAttachment(storage_file) ? true : false;
      }
      return summary;
    })
  );

  public seasonalForecasts = signal<IResourceFile[]>([]);

  public downscaledForecasts = signal<IResourceFile[]>([]);

  constructor(private service: ClimateForecastService, private configurationService: ConfigurationService) {
    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      if (country_code) {
        this.service.loadDailyForecasts(country_code);
      }
    });
  }

  ngOnDestroy() {
    this.closeForecast();
  }

  public async handleForecastClick(forecast: IForecastSummary) {
    if (forecast.downloaded) {
      this.openForecast(forecast);
    } else {
      const downloader = this.downloaders().find((d) => d.storage_path() === forecast.storage_file);
      if (downloader) {
        forecast._doc = await this.service.downloadForecastFile(forecast._doc, downloader);
        await this.openForecast(forecast);
      }
    }
  }

  public closeForecast() {
    if (this.pdfSrc) {
      URL.revokeObjectURL(this.pdfSrc);
    }
    this.pdfSrc = undefined;
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
