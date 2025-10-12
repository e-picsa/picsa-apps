/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode, ILocaleDataEntry, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { IResourceFile } from '@picsa/resources/schemas';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';

import { LOCALISED_MANUALS, PICSA_MANUAL_CONTENTS } from '../../data';
import { IManualPeriodEntryLocalised, IManualStepLocalised } from '../../models';

@Component({
  selector: 'picsa-manual-select',
  imports: [CommonModule, MatSelectModule, MatIconModule, FormsModule, PicsaTranslateModule],
  templateUrl: './manual-select.component.html',
  styleUrl: './manual-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO - rename manual-version-select and return manual data (?)
export class ManualSelectComponent {
  variant = input.required<'farmer' | 'extension'>();

  public manualSelected = output<{ manual: IResourceFile; contents: IManualPeriodEntryLocalised[] }>();

  private configurationService = inject(ConfigurationService);

  private translateService = inject(PicsaTranslateService);

  private countryCode = computed(() => this.configurationService.userSettings().country_code);

  private languageCode = computed(() => this.configurationService.userSettings().language_code);

  // Lookup localised manuals available for current country
  private availableManuals = computed(() => {
    const variant = this.variant();
    const countryCode = this.countryCode();
    const filteredEntries = Object.entries(LOCALISED_MANUALS[variant]).filter(([locale]) =>
      locale.startsWith(countryCode),
    );
    return Object.fromEntries(filteredEntries);
  });

  private destroyRef = inject(DestroyRef);

  public languageOptions = computed(() => {
    const manuals = this.availableManuals();
    return Object.keys(manuals).map((v) => LOCALES_DATA_HASHMAP[v] as ILocaleDataEntry);
  });

  public languageSelected = model<ILocaleCode>();

  constructor() {
    // Reset language select when variant changes
    effect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const variant = this.variant();
      this.languageSelected.set(undefined);
    });

    // Auto-select initial language
    effect(() => {
      if (!this.languageSelected()) {
        const defaultLanguage = this.loadDefaultLangauge();
        if (defaultLanguage) {
          this.languageSelected.set(defaultLanguage);
        }
      }
    });

    // Output selected manual when changed
    effect(() => {
      const lang = this.languageSelected();
      const availableManuals = this.availableManuals();
      if (lang) {
        const manual = availableManuals[lang];
        if (manual) {
          const contents = this.generateLocalisedContents(lang);
          this.manualSelected.emit({ contents, manual });
        }
      }
    });

    // Temporarily change app language if manual lang selected
    effect(() => {
      const lang = this.languageSelected();
      if (lang && lang !== this.translateService.language) {
        this.translateService.ngxTranslate.use(lang);
      }
    });

    // Restore app language on destroy
    this.destroyRef.onDestroy(() => {
      this.restoreAppLanguage();
    });
  }

  private restoreAppLanguage() {
    const { language_code } = this.configurationService.userSettings();
    if (language_code !== this.translateService.ngxTranslate.currentLang) {
      this.translateService.ngxTranslate.use(language_code);
    }
  }

  private loadDefaultLangauge(): ILocaleCode {
    const appLanguageCode = this.languageCode();
    if (this.languageOptions().find((v) => v.id === appLanguageCode)) {
      return appLanguageCode;
    }
    return this.languageOptions()[0].id as ILocaleCode;
  }

  private generateLocalisedContents(locale: ILocaleCode): IManualPeriodEntryLocalised[] {
    return PICSA_MANUAL_CONTENTS[this.variant()].map(({ label, steps }) => {
      const localisedSteps = steps.map(({ activities, label, name, page, type }) => {
        const localisedStep: IManualStepLocalised = { activities, label, name, type, page: page[locale] };
        return localisedStep;
      });
      const localisedPeriod: IManualPeriodEntryLocalised = { label, steps: localisedSteps };
      return localisedPeriod;
    });
  }
}
