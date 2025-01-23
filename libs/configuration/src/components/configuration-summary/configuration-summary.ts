import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { COUNTRIES_DATA_HASHMAP, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';

import { ConfigurationService } from '../../provider';
import { PicsaConfigurationSelectComponent } from '../configuration-select/configuration-select.component';

/** UI button that displays summary of current configuration and launches dialog to change */
@Component({
  selector: 'picsa-configuration-summary',
  templateUrl: 'configuration-summary.html',
  styleUrl: './configuration-summary.scss',
  imports: [CommonModule, MatButtonModule, MatDialogModule, PicsaConfigurationSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaConfigurationSummaryComponent {
  public label = '';
  public image = '';
  constructor(
    public configurationService: ConfigurationService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      if (country_code) {
        const countryMeta = COUNTRIES_DATA_HASHMAP[country_code];
        const { flag_path, label } = countryMeta;
        this.label = label;
        const { language_code } = this.configurationService.userSettings();
        const languageMeta = LOCALES_DATA_HASHMAP[language_code];
        if (languageMeta) {
          this.label += ` - ${languageMeta.language_label}`;
        }
        this.image = flag_path;
        this.cdr.markForCheck();
      }
    });
  }
}
