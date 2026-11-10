import { ChangeDetectionStrategy, Component, computed, effect, inject, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { ICountryCode, ILocaleCode, LOCALES_DATA } from '@picsa/data';
import { DIGITAL_SKILLS_VIDEO_HASHMAP, FARMER_VIDEO_HASHMAP } from '@picsa/data/resources';
import { PicsaTranslateModule } from '@picsa/i18n';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';
import { switchMap } from 'rxjs';

import { ResourceDownloadComponent, ResourceDownloadMultipleComponent } from '../../components';
import { RESOURCE_BUNDLES } from '../../data';
import { PICSA_MANUAL_RESOURCES } from '../../data/picsa/manuals';
import { ResourcesMaterialModule } from '../../material.module';
import { IResourceFile } from '../../schemas';
import { ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';

export type IResourceCategory = 'Extension Resource' | 'PICSA Manual' | 'Farmer Video' | 'Digital Skills' | '';
export type IResourceSource = IResourceCategory;

/** Pre-indexed set of all extension bundle file IDs across all country bundles */
const ALL_BUNDLE_FILE_IDS = new Set<string>(
  Object.values(RESOURCE_BUNDLES).flatMap((bundle) => (bundle.files || []).map((file) => file.id)),
);

/** Table data stores original doc separate to data, and populates _downloaded state */
type IResourceTableEntry = IResourceFile & {
  _downloaded: boolean;
  _actions: Record<string, boolean>;
  category: IResourceCategory;
  source: IResourceCategory;
  doc: RxDocument<IResourceFile>;
};

const DISPLAY_COLUMNS = [
  '_downloaded',
  'title',
  'category',
  'subtype',
  'size_kb',
  '_actions',
] as const satisfies (keyof IResourceTableEntry)[];

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ResourcesMaterialModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatChipsModule,
    PicsaTranslateModule,
    PicsaDataTableComponent,
    SizeMBPipe,
    ResourceDownloadComponent,
    ResourceDownloadMultipleComponent,
  ],
})
export class DownloadsPageComponent {
  service = inject(ResourcesToolService);

  private configurationService = inject(ConfigurationService);
  private downloadService = inject(ResourcesDownloadService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private dbFiles$ = this.service.ready$.pipe(switchMap(() => this.service.dbFiles.find().$));

  private allResourceFileDocs = toSignal(this.dbFiles$, { initialValue: [] });

  private resourceFileDocs = computed(() => {
    const { country_code } = this.configurationService.deploymentSettings();
    const manifest = this.service.activeManifest();
    const currentLang = this.languageFilter();

    return this.allResourceFileDocs().filter((doc) => {
      if (!this.isFileInDeployment(doc._data, country_code, manifest.filesById)) {
        return false;
      }
      return this.shouldShowResource(doc._data, currentLang);
    });
  });

  public tableData = computed(() => this.resourceFileDocs().map((doc) => this.toTableData(doc)));

  /** Table data filtered by PicsaDataTableComponent (column filters & search) */
  public filteredTableData = signal<IResourceTableEntry[] | null>(null);

  public pendingDownloads = computed(() => {
    const rows = this.filteredTableData() ?? this.tableData();
    return rows.filter((v) => !v._downloaded).map((v) => v.doc);
  });

  public pendingDownloadsSize = computed(() =>
    this.pendingDownloads().reduce((prev, current) => prev + current.size_kb || 0, 0),
  );

  public languageLabels = Object.fromEntries(LOCALES_DATA.map(({ id, language_label }) => [id, language_label]));

  public languageFilterOptions = computed(() => {
    const { country_code } = this.configurationService.deploymentSettings();
    return LOCALES_DATA.filter((v) => v.country_code === country_code);
  });
  public languageFilter = model<ILocaleCode | undefined>(this.resolveInitialLanguage());

  private hasInitializedLanguage = false;

  constructor() {
    effect(() => {
      const initialLang = this.resolveInitialLanguage();
      if (initialLang && !this.hasInitializedLanguage) {
        this.hasInitializedLanguage = true;
        this.languageFilter.set(initialLang);
      }
    });
  }

  /**
   * Determine the user's active language for initial filtering.
   * Matches the deployment's country locale options, defaulting to user's language setting.
   */
  private resolveInitialLanguage(): ILocaleCode | undefined {
    const userSettings = this.configurationService.userSettings();
    const deployment = this.configurationService.deploymentSettings();
    const userLang = userSettings.language_code;
    const countryOptions = LOCALES_DATA.filter((v) => v.country_code === deployment.country_code);

    if (userLang && countryOptions.some((opt) => opt.id === userLang)) {
      return userLang;
    }
    if (userLang && (userLang === 'global_en' || userLang.endsWith('_en'))) {
      const countryEn = countryOptions.find((opt) => opt.id.endsWith('_en'));
      if (countryEn) return countryEn.id as ILocaleCode;
    }
    return userLang || (countryOptions[0]?.id as ILocaleCode);
  }

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    filterColumns: ['category', 'subtype'],
    formatHeader: (value) => {
      if (value === 'category' || value === 'source') return 'Category';
      if (value === 'subtype') return 'Type';
      if (value === 'size_kb') return 'Size';
      if (value === '_downloaded') return '';
      if (value === '_actions') return '';
      return formatHeaderDefault(value);
    },
    search: false,
    rowTrackBy: (_, row: IResourceTableEntry) => row.id,
  };

  public async deleteDownload(resource: IResourceFile, event: Event) {
    event.stopImmediatePropagation();
    const doc = await this.service.dbFiles.findOne(resource.id).exec();
    if (doc) {
      return this.service.removeFileAttachment(doc);
    }
    return;
  }

  public async handleRowClick(entry: IResourceTableEntry) {
    if (entry._downloaded) {
      return this.openResource(entry);
    } else {
      return this.downloadResource(entry.doc);
    }
  }

  /** Open a downloaded resource in the in-app viewer */
  public openResource(entry: IResourceTableEntry, event?: Event) {
    // prevent the row click handler from triggering a duplicate navigation
    event?.stopPropagation();
    return this.router.navigate([entry.id], { relativeTo: this.route });
  }

  /** Programatically trigger rendered <resource-download> component to download specific resource */
  private async downloadResource(doc: RxDocument<IResourceFile>) {
    const entry = await this.downloadService.register(doc);
    await entry.download();
  }

  /** Determine whether a resource file is relevant to the active country deployment */
  private isFileInDeployment(
    resource: IResourceFile,
    countryCode: ICountryCode,
    activeManifestFilesById: Record<string, IResourceFile>,
  ): boolean {
    if (countryCode === 'global') return true;

    // Direct match with active country manifest (bundle files)
    if (activeManifestFilesById[resource.id]) return true;

    // Explicit country filter specified on resource (e.g. manuals)
    if (resource.filter?.countries) {
      return resource.filter.countries.includes(countryCode);
    }

    // Locale-based scoping (e.g. farmer videos, global manuals)
    if (resource.language) {
      if (resource.language.startsWith(`${countryCode}_`)) return true;
      if (resource.language.startsWith('global_')) return true;
      return false;
    }

    return false;
  }

  /** Filter resources by selected language filter */
  private shouldShowResource(resource: IResourceFile, languageFilter?: ILocaleCode) {
    if (!languageFilter || !resource.language) {
      return true;
    }

    // Direct match with selected locale
    if (resource.language === languageFilter) {
      return true;
    }

    // Include global English resources when any localised English language is selected
    if (resource.language === 'global_en' && languageFilter.endsWith('_en')) {
      return true;
    }

    // Match cross-border languages sharing the same language subtag (e.g. mw_ny and zm_ny)
    // when the resource is explicitly designated for this country
    const filterLang = languageFilter.split('_')[1];
    const resourceLang = resource.language.split('_')[1];
    if (filterLang && filterLang === resourceLang && resource.filter?.countries) {
      const filterCountry = languageFilter.split('_')[0] as ICountryCode;
      if (resource.filter.countries.includes(filterCountry)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine authoritative content category for a resource based on exact registry membership.
   * Returns blank ('') if unrecognized to prevent mislabeling.
   */
  public getResourceCategory(resourceId: string): IResourceCategory {
    const manifest = this.service.activeManifest();
    if (manifest.filesById[resourceId] || ALL_BUNDLE_FILE_IDS.has(resourceId)) {
      return 'Extension Resource';
    }
    if (PICSA_MANUAL_RESOURCES[resourceId as keyof typeof PICSA_MANUAL_RESOURCES]) {
      return 'PICSA Manual';
    }
    if (DIGITAL_SKILLS_VIDEO_HASHMAP[resourceId]) {
      return 'Digital Skills';
    }
    if (FARMER_VIDEO_HASHMAP[resourceId]) {
      return 'Farmer Video';
    }
    return '';
  }

  public getResourceSource(resourceId: string): IResourceCategory {
    return this.getResourceCategory(resourceId);
  }

  private toTableData(doc: RxDocument<IResourceFile>): IResourceTableEntry {
    const _downloaded = Object.keys(doc._data._attachments).length > 0;
    const _actions = { delete: _downloaded ? true : false };
    const category = this.getResourceCategory(doc.id);
    return {
      ...doc._data,
      _downloaded,
      _actions,
      category,
      source: category,
      doc,
    };
  }
}
