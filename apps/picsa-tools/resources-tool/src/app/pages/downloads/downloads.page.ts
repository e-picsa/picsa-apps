import { Clipboard } from '@angular/cdk/clipboard';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
// import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
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
  public fileResources: IResourceFile[] = [];
  public fileResourceDocs: MatTableDataSource<RxDocument<IResourceFile>>;
  public displayedColumns = [...DISPLAY_COLUMNS, 'download_button', 'menu_options'];

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public service: ResourcesToolService, 
    private notificationService: PicsaNotificationService,
    private clipboard: Clipboard,
    // private router: Router
  ) {}

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
  public async shareDocument(doc: RxDocument<IResourceFile>) {
    // console.log(doc)
    if (Capacitor.isNativePlatform()) {
      console.log('native device')
      
    }else{
      try {
        // could share the link but they are protected and the page will not open
        // const fullLink = window.location.href + this.router.url;
        // Copy resource URL
        //TODO: Probably add and use a URL shortener service
        await this.clipboard.copy(doc._data.url);
        this.notificationService.showUserNotification({ matIcon: 'copy', message: "Download link copied to clipboard" });
      } catch (error) {
        console.error('Error copying link or showing notification:', error);
        this.notificationService.showUserNotification({ matIcon: 'error', message: "Failed to copy link" }); 
      }
    }
    
    
  }
}
