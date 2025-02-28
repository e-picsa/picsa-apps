import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, OnDestroy, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';
import { RxDocument } from 'rxdb';

import { IForecast } from '../../schemas';

interface IViewerForecast {
  _doc: RxDocument<IForecast>;
  storage_file: string;
}

@Component({
  selector: 'forecast-viewer',
  imports: [CommonModule, MatButtonModule, MatIconModule, PdfViewerComponent, PicsaTranslateModule],
  templateUrl: './forecast-viewer.component.html',
  styleUrl: './forecast-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastViewerComponent implements OnDestroy {
  public forecast = input<IViewerForecast>();

  public closeClicked = output();

  public errorMessage = signal<string>('');

  /** URI to forecast file data */
  private uri: string | null = null;

  /** Html forecasts will be parsed as SafeHtml for render in a div */
  public htmlForecastData = signal<SafeHtml | undefined>(undefined);

  /** PDF forecasts will be linked as URI for render in the <picsa-pdf-viewer> component */
  public pdfForecastData = signal<string | undefined>(undefined);

  constructor(private dbAttachmentService: PicsaDatabaseAttachmentService, private sanitizer: DomSanitizer) {
    effect(async () => {
      const forecast = this.forecast();
      this.clearForecastData();
      if (forecast) {
        this.errorMessage.set('');
        this.openForecast(forecast);
      } else {
        this.errorMessage.set('Failed to open forecast');
      }
    });
  }

  ngOnDestroy(): void {
    this.clearForecastData();
  }

  private clearForecastData() {
    this.pdfForecastData.set(undefined);
    this.htmlForecastData.set(undefined);
    if (this.uri) {
      URL.revokeObjectURL(this.uri);
      this.uri = null;
    }
  }

  /** Retrieve forecast attachment URI and call content render */
  private async openForecast(forecast: IViewerForecast) {
    this.uri = await this.dbAttachmentService.getFileAttachmentURI(forecast._doc, forecast.storage_file);
    const fileType = forecast.storage_file.split('.').pop()?.toLowerCase();
    if (this.uri && fileType) {
      return this.renderForecastContent(this.uri, fileType as any);
    }
  }

  /** Handle rendering of forecast content from URI for different filetypes */
  private async renderForecastContent(uri: string, filetype: 'pdf' | 'html') {
    // return pdf uri directly for render within picsa-pdf-reader component
    if (filetype === 'pdf') {
      this.pdfForecastData.set(uri);
      return;
    }

    // read html blob data directly and parse as safe-html
    if (filetype === 'html') {
      const res = await fetch(uri);
      const html = await res.text();
      if (html) {
        const safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.htmlForecastData.set(safeHtml);
      }
      return;
    }

    this.errorMessage.set(`Forecast failed to open ${filetype}`);
  }
}
