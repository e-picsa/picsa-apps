import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { COUNTRIES_DATA_HASHMAP, ILocaleDataEntry, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { capitalise } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { TranslationDashboardService } from '../../translations.service';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];
@Component({
  selector: 'dashboard-translations-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    PicsaDataTableComponent,
    PicsaLoadingComponent,
    RouterModule,
  ],
  templateUrl: './translations.page.html',
  styleUrls: ['./translations.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsPageComponent {
  /** Table options specific to active deployment (display columns vary depending on country) */
  public tableOptions = computed<IDataTableOptions>(() => {
    const locale = this.locale();
    return this.generateTableOptions(locale);
  });

  /** Specify whether to show all translations or just missing */
  public includeTranslated = signal(false);

  /** List of available locales for deployment country */
  public localeOptions = signal<ILocaleDataEntry[]>([]);

  /** ID of currently selected locale */
  public locale = signal(LOCALES_DATA_HASHMAP.global_en.id);

  /** Generated list of table entries */
  public tableData = computed(() => {
    const translations = this.service.translations();
    const locale = this.locale();
    const data = this.generateTableData(locale, translations, this.includeTranslated());
    return data;
  });

  /** List of entries pending translation */
  public pendingEntries = computed(() => {
    const locale = this.locale();
    return this.service.translations().filter((entry) => !entry[locale]);
  });

  public translationProgress = computed(() => (100 * this.countTranslated) / this.countTotal);

  public get countTotal() {
    return this.service.translations().length;
  }
  public get countPending() {
    return this.pendingEntries().length;
  }
  public get countTranslated() {
    return this.countTotal - this.countPending;
  }

  /** */
  private generateTableData(localeId: string, entries: ITranslationRow[], includeTranslated = false) {
    // HACK - ignore list when default translations set
    if (localeId === LOCALES_DATA_HASHMAP.global_en.id) return [];
    // Filter entries to only include those not already translated or archived
    return entries.filter((entry) => {
      if (entry.archived) return false;
      if (!includeTranslated) {
        return entry[localeId] ? false : true;
      }
      return true;
    });
  }

  /** Common table options used independent of deployment selected */
  private tableOptionsBase: IDataTableOptions = {
    displayColumns: [],
    exportFilename: 'translations',
    formatHeader: (v) => {
      const languageData: ILocaleDataEntry = LOCALES_DATA_HASHMAP[v];
      if (languageData) {
        const { language_label, country_code } = languageData;
        const { label: country_label } = COUNTRIES_DATA_HASHMAP[country_code];
        if (country_code === 'global') return capitalise(language_label);
        return capitalise(country_label) + ' - ' + capitalise(language_label);
      }
      return formatHeaderDefault(v);
    },
    paginatorSizes: [10, 50, 100],
    handleRowClick: (row) => this.showEditDialog(row),
  };

  /** Track active country code to avoid refreshing list when toggling between different country versions */
  private activeCountryCode: string;

  constructor(public service: TranslationDashboardService, deploymentService: DeploymentDashboardService) {
    effect(
      async () => {
        const deployment = deploymentService.activeDeployment();
        if (deployment) {
          const { country_code } = deployment;
          if (country_code && country_code !== this.activeCountryCode) {
            this.activeCountryCode = country_code;
            await this.loadTranslationMeta(country_code);
            await this.refreshTranslations();
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  public showEditDialog(row: ITranslationRow) {
    console.log('show edit dialog', row);
    // this.router.navigate([`/translations`, row.id]);
  }

  private async loadTranslationMeta(country_code: string) {
    // List all locales available for current language
    const locales = this.getTargetTranslationLanguages(country_code);
    this.localeOptions.set(locales);
    this.locale.set(locales[0].id);
  }

  private getTargetTranslationLanguages(country_code: string) {
    if (country_code === 'global') {
      return LOCALES_DATA;
    }
    return LOCALES_DATA.filter((o) => o.country_code === country_code);
  }

  private generateTableOptions(locale: string): IDataTableOptions {
    return {
      ...this.tableOptionsBase,
      displayColumns: ['tool', 'context', 'text', locale, 'created_at'],
    };
  }

  private async refreshTranslations() {
    await this.service.ready();
    this.service.listTranslations();
  }
}
