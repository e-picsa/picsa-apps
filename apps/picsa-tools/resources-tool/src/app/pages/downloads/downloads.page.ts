import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfigurationService } from '@picsa/configuration/src';
import { RxDocument } from 'rxdb';
import { Subject } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

const DISPLAY_COLUMNS: (keyof IResourceFile)[] = ['mimetype', 'title', 'size_kb'];

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
})
export class DownloadsPageComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject();

  public fileResourceDocs: MatTableDataSource<RxDocument<IResourceFile>>;
  public displayedColumns = [...DISPLAY_COLUMNS, 'download_button', 'menu_options'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(public service: ResourcesToolService, private configurationService: ConfigurationService) {}

  async ngOnInit() {
    await this.service.ready();
    // retrieve docs only once on load as child item component manages individual subscription
    const resourceFileDocs = await this.service.dbFileCollection.find().exec();
    const filteredDocs = resourceFileDocs.filter((doc) => {
      // filter resources to filter out any resources for other country localisations
      const { country } = this.configurationService.activeConfiguration.localisation;
      const filterCountries = doc._data.filter?.countries || [];
      return filterCountries.length === 0 || filterCountries.includes(country.code);
    });
    this.fileResourceDocs = new MatTableDataSource<RxDocument<IResourceFile>>(filteredDocs);
    this.fileResourceDocs.sort = this.sort;
  }
  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public async deleteDownload(doc: RxDocument<IResourceFile>) {
    const attachment = doc.getAttachment(doc.filename);
    if (attachment) {
      await attachment.remove();
    }
  }
}
