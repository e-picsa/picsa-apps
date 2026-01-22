import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode, ILocaleDataEntry, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IResourceFile } from '@picsa/resources/schemas';

import { LOCALISED_MANUALS, PICSA_MANUAL_CONTENTS } from '../../data';
import { IManualPeriodEntryLocalised, IManualStepLocalised, IManualVariant } from '../../models';

@Component({
  selector: 'picsa-manual-select',
  imports: [MatSelectModule, MatIconModule, MatTabsModule, FormsModule, PicsaTranslateModule],
  templateUrl: './manual-select.component.html',
  styleUrl: './manual-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO - rename manual-version-select and return manual data (?)
export class ManualSelectComponent {
  public manualVariant = signal(this.getDefaultManualVariant());

  public manualSelected = output<{ manual: IResourceFile; contents: IManualPeriodEntryLocalised[] }>();

  private configurationService = inject(ConfigurationService);

  private translateService = inject(PicsaTranslateService);

  private countryCode = computed(() => this.configurationService.userSettings().country_code);

  private languageCode = computed(() => this.configurationService.userSettings().language_code);

  // Lookup localised manuals available for current country
  private availableManuals = computed(() => {
    const variant = this.manualVariant();
    const countryCode = this.countryCode();
    const filteredEntries = Object.entries(LOCALISED_MANUALS[variant]).filter(
      ([locale]) => locale.startsWith(countryCode) || locale === 'global_en',
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
      const variant = this.manualVariant();
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
      if (lang && lang !== this.translateService.ngxTranslate.currentLang) {
        this.translateService.setLanguage(lang);
      }
    });

    // Restore app language on destroy
    this.destroyRef.onDestroy(() => {
      this.restoreAppLanguage();
    });

    // Store default manual variant when set
    effect(() => {
      const variant = this.manualVariant();
      if (variant) {
        this.storeDefaultManualVariant(variant);
      }
    });
  }

  private restoreAppLanguage() {
    const { language_code } = this.configurationService.userSettings();
    if (language_code !== this.translateService.ngxTranslate.currentLang) {
      this.translateService.setLanguage(language_code);
    }
  }

  private loadDefaultLangauge(): ILocaleCode {
    const appLanguageCode = this.languageCode();
    if (this.languageOptions().find((v) => v.id === appLanguageCode)) {
      return appLanguageCode;
    }
    const [firstOption] = this.languageOptions();
    return (firstOption?.id as ILocaleCode) || 'global_en';
  }

  private generateLocalisedContents(locale: ILocaleCode): IManualPeriodEntryLocalised[] {
    return PICSA_MANUAL_CONTENTS[this.manualVariant()].map(({ label, steps }) => {
      const localisedSteps = steps.map(({ activities, label, name, page, type }) => {
        const localisedStep: IManualStepLocalised = { activities, label, name, type, page: page[locale] || -1 };
        return localisedStep;
      });
      const localisedPeriod: IManualPeriodEntryLocalised = { label, steps: localisedSteps };
      return localisedPeriod;
    });
  }

  /** use localstorage to track farmer version preference */
  private getDefaultManualVariant(): IManualVariant {
    return localStorage.getItem('manual_version') === 'farmer' ? 'farmer' : 'extension';
  }
  private storeDefaultManualVariant(version: IManualVariant) {
    return localStorage.setItem('manual_version', version);
  }
}
