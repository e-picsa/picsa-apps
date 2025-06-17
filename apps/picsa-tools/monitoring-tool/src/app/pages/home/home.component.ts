import { ChangeDetectionStrategy, Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfigurationService } from '@picsa/configuration/src';
import { switchMap } from 'rxjs';

import { IMonitoringForm } from '../../schema/forms';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  forms = signal<IMonitoringForm[]>([]);

  // wait until service ready emitted before subscribing to dbFormCollection
  private formDocs = toSignal(this.service.ready$.pipe(switchMap(() => this.service.dbFormCollection.find().$)), {
    initialValue: [],
  });

  constructor(
    public service: MonitoringToolService,
    private configurationService: ConfigurationService,
  ) {
    service.ready();

    effect(() => {
      const { country_code } = this.configurationService.deploymentSettings();
      const formDocs = this.formDocs();
      // filter forms to include only active config country forms
      const forms = formDocs
        .map((doc) => doc._data)
        .filter((form) => !form.appCountries || form.appCountries.includes(country_code));
      this.forms.set(forms);
    });
  }

  public async syncPending() {
    const res = await this.service.syncPending();
    // TODO - show toast?
  }
}
