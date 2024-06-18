import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  standalone: true,
  imports: [CommonModule, ClimateToolComponentsModule, PicsaTranslateModule, PdfViewerComponent],
})
export class ClimateForecastComponent {
  forecastTypes = ['Annual', 'Downscaled'];
  public page = 1;
  public pdfSrc?: string;
  constructor(private route: ActivatedRoute) {}
  // ngOnInit() {}
  openAnnualForeCast() {
    this.pdfSrc = '/assets/forecast-assets/forecastDoc.pdf';
  }
  openDownscaledForeCast() {
    this.pdfSrc = '/assets/forecast-assets/forecastDoc.pdf';
  }
  clearPdf() {
    this.pdfSrc = undefined;
  }
}
