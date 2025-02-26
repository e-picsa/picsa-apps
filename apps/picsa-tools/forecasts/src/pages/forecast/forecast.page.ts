import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, viewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { SupabaseStorageDownloadComponent } from '@picsa/shared/services/core/supabase';
import { RxDocument } from 'rxdb';

import { ForecastLocationSelectComponent } from '../../components/location-select/location-select.component';
import { ForecastService } from './forecast.service';
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
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  imports: [
    CommonModule,
    ForecastLocationSelectComponent,
    MatIcon,
    MatProgressBarModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    ResourcesComponentsModule,
    SupabaseStorageDownloadComponent,
  ],
})
export class ForecastComponent implements OnDestroy {
  public pdfSrc?: string;

  public dailyForecasts = computed(() => this.generateForecastSummary(this.service.dailyForecastDocs()));
  public downscaledForecasts = computed(() => this.generateForecastSummary(this.service.downscaledForecastDocs()));
  public seasonalForecasts = computed(() => this.generateForecastSummary(this.service.seasonalForecastDocs()));

  // Utility to add type-safety to implicit ng-template data
  public toForecastType = (data: any) => data as IForecastSummary;

  /** List of rendered SupabaseStorageDownload components for direct interaction */
  private downloaders = viewChildren(SupabaseStorageDownloadComponent);

  constructor(private service: ForecastService, private dbAttachmentService: PicsaDatabaseAttachmentService) {}

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

  private generateForecastSummary(docs: RxDocument<IClimateForecast>[]): IForecastSummary[] {
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

  private async openForecast(forecast: IForecastSummary) {
    const uri = await this.dbAttachmentService.getFileAttachmentURI(forecast._doc, forecast.storage_file as string);
    this.pdfSrc = uri || undefined;
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
