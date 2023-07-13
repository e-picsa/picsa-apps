import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { KoboService } from '@picsa/webcomponents';
import type { IFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';
import { Subject, takeUntil } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MonitoringToolService } from '../../services/monitoring-tool.service';
import { IFormSubmission } from '../../schema/submissions';
import { xmlToJson } from '@picsa/utils';
import { RxDocument } from 'rxdb';

@Component({
  selector: 'monitoring-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit, OnDestroy {
  public formHtml: string;
  public formXml: string;
  public showForm = false;

  public formId: string;
  public submissionId: string;

  // TODO - tidy to separate components
  // TODO - ensure submission doc defined when executing

  private submissionDoc?: RxDocument<IFormSubmission>;

  public submissions: IFormSubmission[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  constructor(private route: ActivatedRoute, private monitoringService: MonitoringToolService) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  async ngOnInit() {
    await this.monitoringService.ready();
    this.subscribeToRouteChanges();
  }

  public async saveForm(e: Event) {
    if (!this.submissionDoc) {
      // TODO - ensure exists
      return;
    }
    const entry: IFormEntry = (e as any).detail.entry;
    const { xml } = entry;
    const json = xmlToJson(xml);
    const patch: Partial<IFormSubmission> = { xml, json, draft: false };
    const res = await this.submissionDoc.patch(patch);
    console.log('res', res);
  }

  public async autosave(e: Event) {
    // TODO - import types from webcomponent
    const { xml, nodes } = (e as any).detail;
    // TODO - possibly only patch json on component destroy?
    const json = xmlToJson(xml);
    await this.submissionDoc?.patch({ xml, json });
  }

  private async loadFormSubmission(id: string, submission?: IFormSubmission) {
    const formMeta = await this.monitoringService.getForm(id);
    if (formMeta) {
      const { form, model } = formMeta.enketoDefinition;
      this.formHtml = form;
      this.formXml = model;
      this.showForm = true;
    }
  }
  private loadFormResponses(formId: string) {
    const query = this.monitoringService.dbSubmissionsCollection.find({ selector: { formId } });
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((submissions) => {
      console.log('submissions', submissions);
      this.submissions = submissions.map((d) => d._data);
    });
  }

  private subscribeToRouteChanges() {
    this.route.params.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (params) => {
      console.log('params', params);
      const { formId, submissionId } = params;

      if (formId !== this.formId) {
        this.formId = formId;
        this.loadFormResponses(formId);

        if (submissionId) {
          const submissionDoc = await this.monitoringService.dbSubmissionsCollection.findOne(submissionId).exec();
          this.submissionDoc = submissionDoc || undefined;
          await this.loadFormSubmission(formId, submissionDoc?._data);
          this.submissionId = submissionId;
        }
      }
    });
  }

  /**
   * Use native http client on android device to avoid cors issues
   * NOTE - fails to send form body as per
   * https://github.com/ionic-team/capacitor/pull/6206
   * Potential workaround (below) or will require API
   * https://github.com/silkimen/cordova-plugin-advanced-http#uploadfile
   */
  private wipTestKoboEndpoint() {
    const koboService = new KoboService({ authToken: environment.koboAuthToken });
    if (Capacitor.isNativePlatform()) {
      koboService.httpHandlers.req = (endpoint, options) => {
        return CapacitorHttp.request({ url: endpoint, ...(options as any) }).then(async (res) => ({
          status: res.status,
          text: res.data,
        }));
      };
    }
  }
}
