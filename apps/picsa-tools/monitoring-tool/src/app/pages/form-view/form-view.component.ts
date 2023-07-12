import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { KoboService } from '@picsa/webcomponents';
import type { IFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';
import { Subject, takeUntil } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit, OnDestroy {
  public formHtml: string;
  public formXml: string;
  public showForm = true;

  private componentDestroyed$ = new Subject<boolean>();

  private koboService = new KoboService({ authToken: environment.koboAuthToken });

  constructor(private route: ActivatedRoute, private monitoringService: MonitoringToolService) {
    // Use native http client on android device to avoid cors issues

    // NOTE - fails to send form body as per
    // https://github.com/ionic-team/capacitor/pull/6206
    // Potential workaround (below) or will require API
    // https://github.com/silkimen/cordova-plugin-advanced-http#uploadfile

    if (Capacitor.isNativePlatform()) {
      this.koboService.httpHandlers.req = (endpoint, options) => {
        return CapacitorHttp.request({ url: endpoint, ...(options as any) }).then(async (res) => ({
          status: res.status,
          text: res.data,
        }));
      };
    }
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  ngOnInit(): void {
    this.subscribeToRouteChanges();
  }

  public async saveForm(e: Event) {
    const entry: IFormEntry = (e as any).detail.entry;
    const { xml } = entry;
    console.log('save form', entry);
    const res = await this.koboService.submitXMLSubmission(xml);
    console.log('res', res);
  }

  public autosave(data: any) {
    // TODO
    console.log('saving draft', data);
  }

  private loadForm(id: string) {
    const loadedForm = this.monitoringService.getForm(id);
    if (loadedForm) {
      const { form, model } = loadedForm.enketoDefinition;
      this.formHtml = form;
      this.formXml = model;
      this.showForm = true;
    }
  }

  private subscribeToRouteChanges() {
    this.route.params.pipe(takeUntil(this.componentDestroyed$)).subscribe((params) => {
      console.log('params', params);
      const { formId } = params;
      if (formId) {
        this.loadForm(formId);
      }
    });
  }
}
