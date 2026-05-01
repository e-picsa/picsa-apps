import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ConfigurationService } from '@picsa/configuration/src';
import { PicsaTranslateModule } from '@picsa/i18n';
import { switchMap } from 'rxjs';

import { FormItemComponent } from '../../components/form-item/form-item.component';
import { IMonitoringForm } from '../../schema/forms';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, MatIcon, FormItemComponent, PicsaTranslateModule],
})
export class HomeComponent {
  service = inject(MonitoringToolService);
  private configurationService = inject(ConfigurationService);

  forms = signal<IMonitoringForm[]>([]);

  // wait until service ready emitted before subscribing to dbFormCollection
  private formDocs = toSignal(this.service.ready$.pipe(switchMap(() => this.service.dbFormCollection.find().$)), {
    initialValue: [],
  });

  constructor() {
    this.service.ready();

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
