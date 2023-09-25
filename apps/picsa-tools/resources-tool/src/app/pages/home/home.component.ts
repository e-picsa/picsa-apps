import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { ResourcesToolService } from '../../services/resources-tool.service';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject();

  constructor(public service: ResourcesToolService, public store: ResourcesStore) {}

  async ngOnInit() {
    await this.service.ready();
    // TODO - want to subscribe to collections
    const query = this.service.dbFileCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      console.log('home page files retrieved', docs);
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
