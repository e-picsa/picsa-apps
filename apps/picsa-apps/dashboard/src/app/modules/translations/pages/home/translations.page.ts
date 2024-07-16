import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { COUNTRIES_DATA_HASHMAP, ILocaleDataEntry, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import { capitalise } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { IDeploymentRow } from '../../../deployment/types';
import { TranslationDashboardService } from '../../translations.service';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];
@Component({
  selector: 'dashboard-translations-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, PicsaDataTableComponent, PicsaLoadingComponent, RouterModule],
  templateUrl: './translations.page.html',
  styleUrls: ['./translations.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsPageComponent {
  /** Table options specific to active deployment (display columns vary depending on country) */
  public tableOptions: IDataTableOptions;

  public languageHashmap = LOCALES_DATA_HASHMAP;

  public tableData = computed(() => {
    return this.service.translations.filter((entry) => !entry.archived);
  });

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
    paginatorSizes: [50, 100, 250],
    handleRowClick: (row) => this.goToRecord(row),
  };

  /** Track active country code to avoid refreshing list when toggling between different country versions */
  private activeCountryCode: string;

  constructor(
    public service: TranslationDashboardService,
    private router: Router,
    cdr: ChangeDetectorRef,
    deploymentService: DeploymentDashboardService
  ) {
    effect(async () => {
      const deployment = deploymentService.activeDeployment();
      if (deployment) {
        await this.loadTranslations(deployment);
        cdr.markForCheck();
      }
    });
  }

  private async loadTranslations(deployment: IDeploymentRow) {
    const { country_code } = deployment;
    if (country_code && country_code !== this.activeCountryCode) {
      this.activeCountryCode = country_code;
      const languages = this.getTargetTranslationLanguages(country_code);
      this.tableOptions = this.generateTableOptions(languages.map((l) => l.id));
      await this.refreshTranslations();
    }
  }

  private getTargetTranslationLanguages(country_code: string) {
    if (country_code === 'global') {
      return LOCALES_DATA;
    }
    return LOCALES_DATA.filter((o) => o.country_code === country_code);
  }

  private generateTableOptions(languageCodes: string[]): IDataTableOptions {
    return {
      ...this.tableOptionsBase,
      displayColumns: ['tool', 'context', 'text', ...languageCodes, 'created_at'],
    };
  }

  goToRecord(row: ITranslationRow) {
    this.router.navigate([`/translations`, row.id]);
  }

  async refreshTranslations() {
    await this.service.ready();
    this.service.listTranslations().catch((error) => {
      console.error('Error fetching translations:', error);
    });
  }
}
