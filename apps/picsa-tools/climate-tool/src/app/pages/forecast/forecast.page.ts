import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration';
import { ICountryCode } from '@picsa/data';
import { ResourcesComponentsModule } from '@picsa/resources/src/app/components/components.module';
import { IResourceFile } from '@picsa/resources/src/app/schemas';
import { PdfViewerComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SupabaseStorageService } from '@picsa/shared/services/core/supabase/services/supabase-storage.service';

import { ClimateToolComponentsModule } from '../../components/climate-tool-components.module';

@Component({
  selector: 'climate-forecast',
  templateUrl: './forecast.page.html',
  styleUrls: ['./forecast.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    PicsaTranslateModule,
    PdfViewerComponent,
    ResourcesComponentsModule,
  ],
})
export class ClimateForecastComponent {
  forecastTypes = ['Annual', 'Downscaled'];
  public page = 1;
  public pdfSrc?: string;

  public seasonalForecasts = signal<IResourceFile[]>([]);

  public downscaledForecasts = signal<IResourceFile[]>([]);

  constructor(private configurationService: ConfigurationService, private storageService: SupabaseStorageService) {
    effect(
      () => {
        const { country_code } = this.configurationService.deploymentSettings();
        this.loadForecasts(country_code);
      },
      { allowSignalWrites: true }
    );
  }

  private loadForecasts(country_code: ICountryCode) {
    // TODO
  }

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
