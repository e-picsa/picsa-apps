import { ChangeDetectionStrategy, Component, effect, inject,signal } from '@angular/core';
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
  imports: [MatButtonModule, MatDialogModule, PicsaConfigurationSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaConfigurationSummaryComponent {
  configurationService = inject(ConfigurationService);
  dialog = inject(MatDialog);

  public label = signal('');
  public image = signal('');
  constructor() {
    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      if (country_code) {
        const countryMeta = COUNTRIES_DATA_HASHMAP[country_code];
        const { flag_path, label } = countryMeta;
        this.label.set(label);
        const { language_code } = this.configurationService.userSettings();
        const languageMeta = LOCALES_DATA_HASHMAP[language_code];
        if (languageMeta) {
          this.label.set(`${label} - ${languageMeta.language_label}`);
        }
        this.image.set(flag_path);
      }
    });
  }
}
