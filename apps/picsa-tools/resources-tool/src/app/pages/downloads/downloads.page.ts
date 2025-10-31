import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ConfigurationService } from '@picsa/configuration/src';
import { ICountryCode, ILocaleCode, LOCALES_DATA } from '@picsa/data';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';
import { switchMap } from 'rxjs';

import { ResourceDownloadComponent, ResourceDownloadMultipleComponent } from '../../components';
import { IResourceFile } from '../../schemas';
import { ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';

/** Table data stores original doc separate to data, and populates _downloaded state */
type IResourceTableEntry = IResourceFile & { _downloaded: boolean } & { doc: RxDocument<IResourceFile> };

const DISPLAY_COLUMNS = [
  'subtype',
  'title',
  'language',
  'size_kb',
  '_downloaded',
] as const satisfies (keyof IResourceTableEntry)[];

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
  imports: [
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
  private configurationService = inject(ConfigurationService);
  private downloadService = inject(ResourcesDownloadService);

  private dbFiles$ = this.service.ready$.pipe(switchMap(() => this.service.dbFiles.find().$));

  private allResourceFileDocs = toSignal(this.dbFiles$, { initialValue: [] });

  private resourceFileDocs = computed(() => {
    const { country_code } = this.configurationService.userSettings();
    return this.allResourceFileDocs().filter((doc) =>
      this.shouldShowResource(doc._data, country_code, this.languageFilter()),
    );
  });

  public tableData = computed(() => this.resourceFileDocs().map((doc) => this.toTableData(doc)));

  public pendingDownloads = computed(() =>
    this.tableData()
      .filter((v) => !v._downloaded)
      .map((v) => v.doc),
  );

  public pendingDownloadsSize = computed(() =>
    this.pendingDownloads().reduce((prev, current) => prev + current.size_kb || 0, 0),
  );

  public languageLabels = Object.fromEntries(LOCALES_DATA.map(({ id, language_label }) => [id, language_label]));

  public languageFilterOptions = computed(() => {
    const { country_code } = this.configurationService.userSettings();
    return LOCALES_DATA.filter((v) => v.country_code === country_code);
  });
  public languageFilter = model(this.configurationService.userSettings().language_code);

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    formatHeader: (value) => {
      if (value === 'subtype') return 'Type';
      if (value === 'size_kb') return 'Size';
      if (value === '_downloaded') return 'Download';
      return formatHeaderDefault(value);
    },
    search: false,
    rowTrackBy: (_, row: IResourceTableEntry) => row.id,
  };

  constructor(public service: ResourcesToolService) {}

  public async deleteDownload(resource: IResourceFile) {
    const doc = await this.service.dbFiles.findOne(resource.id).exec();
    if (doc) {
      return this.service.removeFileAttachment(doc);
    }
    return;
  }

  public async handleRowClick(entry: IResourceTableEntry) {
    if (entry._downloaded) {
      return this.handleResourceOpen(entry);
    } else {
      return this.downloadResource(entry.doc);
    }
  }

  private async handleResourceOpen(entry: IResourceTableEntry) {
    const uri = await this.service.getFileAttachmentURI(entry.doc, false);
    if (uri) {
      await this.service.openFileResource(uri, entry.mimetype, entry.id);
    }
  }

  /** Programatically trigger rendered <resource-download> component to download specific resource */
  private async downloadResource(doc: RxDocument<IResourceFile>) {
    const entry = await this.downloadService.register(doc);
    await entry.download();
  }

  /** Filter resources both by resource own country filter, and then by selected language filter */
  private shouldShowResource(resource: IResourceFile, country_code: ICountryCode, languageFilter: ILocaleCode) {
    const filterCountries = resource.filter?.countries;
    if (filterCountries && !filterCountries.includes(country_code)) return false;
    if (languageFilter && resource.language) {
      // include global english resources when any localised english language selected
      if (resource.language === 'global_en') return languageFilter.endsWith('_en');
      return languageFilter === resource.language;
    }
    return true;
  }

  private toTableData(doc: RxDocument<IResourceFile>): IResourceTableEntry {
    return {
      ...doc._data,
      _downloaded: Object.keys(doc._data._attachments).length > 0,
      doc,
    };
  }
}
