import { Component } from '@angular/core';

import { MonitoringToolService } from '../../services/monitoring-tool.service';
import { Subject, takeUntil } from 'rxjs';
import { IMonitoringForm } from '../../schema/forms';

@Component({
  selector: 'monitoring-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  forms: IMonitoringForm[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  constructor(public service: MonitoringToolService) {}

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
  }

  async ngOnInit() {
    await this.service.ready();
    // create a live query to retrieve all docs on data change
    // pipe subscription to complete when component destroyed (avoids memory leak)
    const query = this.service.dbFormCollection.find();
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      this.forms = docs.map((doc) => doc._data);
    });
  }
}
