import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { DashboardMaterialModule } from '../../../../material.module';
import { TranslationDashboardService } from '../../translations.service';
import { TranslationsJSONImportComponent } from './components/json-import/json-import.component';
import { TranslationsXLSXImportComponent } from './components/xlsx-import/xlsx-import.component';

@Component({
  selector: 'dashboard-translations-import',
  imports: [DashboardMaterialModule, TranslationsJSONImportComponent, TranslationsXLSXImportComponent],
  templateUrl: './translations-import.component.html',
  styleUrl: './translations-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsImportComponent {
  public service = inject(TranslationDashboardService);
}
