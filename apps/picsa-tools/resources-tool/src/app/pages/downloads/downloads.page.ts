import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';
import { Subject } from 'rxjs';

import { ResourceDownloadComponent, ResourceDownloadMultipleComponent } from '../../components';
import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

const DISPLAY_COLUMNS: (keyof IResourceFile)[] = ['mimetype', 'title', 'size_kb'];

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
  imports: [
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    PicsaTranslateModule,
    SizeMBPipe,
    ResourceDownloadMultipleComponent,
    ResourceDownloadComponent,
  ],
})
export class DownloadsPageComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject();
  public fileResources: IResourceFile[] = [];
  public fileResourceDocs: MatTableDataSource<RxDocument<IResourceFile>>;
  public displayedColumns = [...DISPLAY_COLUMNS, 'download_button', 'menu_options'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(public service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();
    // retrieve docs only once on load as child item component manages individual subscription
    const resourceFileDocs = await this.service.dbFiles.find().exec();
    const filteredDocs = this.service.filterLocalisedResources(resourceFileDocs);
    this.fileResourceDocs = new MatTableDataSource<RxDocument<IResourceFile>>(filteredDocs);
    this.fileResourceDocs.sort = this.sort;
    this.fileResources = this.fileResourceDocs.data.map((d) => d._data as IResourceFile);
  }
  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public async deleteDownload(doc: RxDocument<IResourceFile>) {
    return this.service.removeFileAttachment(doc);
  }
}
