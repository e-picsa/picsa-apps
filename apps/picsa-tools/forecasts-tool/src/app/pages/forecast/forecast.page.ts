import { CommonModule } from '@angular/common';
import { Component, computed, signal, viewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ForecastViewerComponent } from '@picsa/forecasts/components/forecast-viewer/forecast-viewer.component';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { RxDocument } from 'rxdb';

import { ForecastLocationSelectComponent } from '../../components/location-select/location-select.component';
import { ForecastService } from './forecast.service';
import { IForecast } from './schemas';

interface IForecastSummary {
  _doc: RxDocument<IForecast>;
  id: string;
  label: string;
  storage_file: string;
  downloaded: boolean;
  type: string;
}

@Component({
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ForecastLocationSelectComponent,
    ForecastViewerComponent,
    MatIcon,
    MatProgressBarModule,
    PicsaTranslateModule,
    SupabaseStorageDownloadComponent,
  ],
})
export class ForecastComponent {
  /** Forecast summary for display in forecast-viewer component */
  public viewerForecast = signal<IForecastSummary | undefined>(undefined);
  public viewerOpen = signal(false);

  public dailyForecasts = computed(() => this.generateForecastSummary(this.service.dailyForecastDocs()));
  public downscaledForecasts = computed(() => this.generateForecastSummary(this.service.downscaledForecastDocs()));
  public seasonalForecasts = computed(() => this.generateForecastSummary(this.service.seasonalForecastDocs()));

  // Utility to add type-safety to implicit ng-template data
  public toForecastType = (data: any) => data as IForecastSummary;

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  constructor(private service: ForecastService, private dbAttachmentService: PicsaDatabaseAttachmentService) {}

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
      const { id, storage_file, forecast_type } = doc;
      const label = this.generateForecastLabel(storage_file);
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
