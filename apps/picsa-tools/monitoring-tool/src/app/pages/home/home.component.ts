import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { Subject, takeUntil } from 'rxjs';

import { IMonitoringForm } from '../../schema/forms';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  forms: IMonitoringForm[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  constructor(public service: MonitoringToolService, private configurationService: ConfigurationService) {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
  }

  async ngOnInit() {
    await this.service.ready();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbFormCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      const { country_code } = this.configurationService.deploymentSettings();
      // filter forms to include only active config country forms
      this.forms = docs
        .map((doc) => doc._data)
        .filter((form) => !form.appCountries || form.appCountries.includes(country_code));
    });
  }

  public async syncPending() {
    const res = await this.service.syncPending();
    // TODO - show toast?
  }
}
