import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-downloads',
  templateUrl: './downloads.component.html',
  styleUrls: ['./downloads.component.scss'],
})
export class DownloadsComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject();

  public fileResources: IResourceFile[] = [];
  public displayedColumns: (keyof IResourceFile)[] = ['mimetype', 'title', 'size_kb', 'downloaded'];

  constructor(public service: ResourcesToolService) {}

  public downloadResource(resource: IResourceFile) {
    console.log('downloadResource');
    // TODO - service method
  }

  async ngOnInit() {
    await this.service.ready();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbFileCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      console.log(
        'downloads',
        docs.map((d) => d._data)
      );
      this.fileResources = docs.map((d) => d._data);
      // const { code } = this.configurationService.activeConfiguration.localisation.country;
      // // filter forms to include only active config country forms
      // this.forms = docs
      //   .map((doc) => doc._data)
      //   .filter((form) => !form.appCountries || form.appCountries.includes(code));
    });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
}
