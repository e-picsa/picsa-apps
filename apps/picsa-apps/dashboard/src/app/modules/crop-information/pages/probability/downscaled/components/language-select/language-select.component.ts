import { ChangeDetectionStrategy, Component, computed, effect, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { DeploymentDashboardService } from '../../../../../../../modules/deployment/deployment.service';

@Component({
  selector: 'dashboard-crop-probability-language-select',
  imports: [FormsModule, MatFormField, MatIcon, MatLabel, MatSelect, MatOption, PicsaTranslateModule],
  templateUrl: './language-select.component.html',
  styleUrl: './language-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * HACK
 * Temporary component used to set the language used by the crop
 * probability table imported from main app
 */
export class CropProbabilityLanguageSelectComponent {
  private deploymentService = inject(DeploymentDashboardService);

  public languageSelected = model(LOCALES_DATA_HASHMAP.global_en.id);
  public languageOptions = computed(() =>
    this.generateLanguageOptions(this.deploymentService.activeDeploymentCountry()),
  );

  constructor() {
    const translateService = inject(TranslateService);

    // HACK - Set frontend translation service lang on language selection change
    effect(() => {
      const selected = this.languageSelected();
      translateService.use(selected);
    });
  }

  private generateLanguageOptions(countryCode: string) {
    const locales = LOCALES_DATA.filter((v) => v.country_code === countryCode);
    return [LOCALES_DATA_HASHMAP.global_en, ...locales];
  }
}
