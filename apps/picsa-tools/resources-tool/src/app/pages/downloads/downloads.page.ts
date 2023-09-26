import { Component, OnDestroy, OnInit } from '@angular/core';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

const DISPLAY_COLUMNS: (keyof IResourceFile)[] = ['mimetype', 'title', 'size_kb', 'downloaded'];

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.page.html',
  styleUrls: ['./downloads.page.scss'],
})
export class DownloadsPageComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject();

  public fileResourceDocs: RxDocument<IResourceFile>[] = [];
  public displayedColumns = [...DISPLAY_COLUMNS, 'menu_options'];

  constructor(public service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbFileCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.fileResourceDocs = docs;
      // const { code } = this.configurationService.activeConfiguration.localisation.country;
      // // filter forms to include only active config country forms
      // this.forms = docs
      //   .map((doc) => doc._data)
      //   .filter((form) => !form.appCountries || form.appCountries.includes(code));
    });
  }

  public async deleteDownload(resource: RxDocument<IResourceFile>) {
    const attachment = resource.getAttachment(resource.filename);
    if (attachment) {
      await attachment.remove();
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}
