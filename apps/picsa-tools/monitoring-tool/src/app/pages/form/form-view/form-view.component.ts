import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { PicsaDialogService } from '@picsa/shared/features';
import { xmlNodeReplaceContent, xmlToJson } from '@picsa/utils';
import type { IEnketoFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { IFormSubmission } from '../../../schema/submissions';
import { MonitoringToolService } from '../../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit, OnDestroy {
  public formInitial: {
    /** html form representation */
    form: string;
    /** xml string model */
    model: string;
    /** DB submission */
    submission: IFormSubmission;
  };

  /** Form entry data from enketo form */
  public formEntry?: IEnketoFormEntry;
  private formId: string;
  /** Track if form has already had finalisation action (e.g. update/delete) */
  private formFinalised = false;

  /** DB doc linked to current submission entry */
  private submissionDoc: RxDocument<IFormSubmission>;
  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private monitoringService: MonitoringToolService,
    private componentService: PicsaCommonComponentsService,
    private dialogService: PicsaDialogService
  ) {}

  async ngOnDestroy() {
    // Check whether outstanding data requires saving/deleting
    if (!this.formFinalised) {
      await this.finaliseForm();
    }
    this.componentDestroyed$.next(true);
  }

  async ngOnInit() {
    await this.monitoringService.ready();
    this.subscribeToRouteChanges();
  }

  /** Handle save event triggered from enketo form */
  public async handleSave(e: Event) {
    const entry: IEnketoFormEntry = (e as any).detail.entry;
    this.formEntry = entry;
    await this.finaliseForm('UPDATE');
    this.componentService.back();
  }

  /** Handle save event triggered from button */
  public async handleCustomSave() {
    if (this.formEntry) {
      this.formEntry.draft = false;
      await this.finaliseForm('UPDATE');
      this.componentService.back();
    }
  }

  /** When autosave triggered store value in memory (write on destroy) */
  public async handleAutosave(e: Event) {
    const entry = (e as any).detail as IEnketoFormEntry;
    this.formEntry = entry;
  }

  public async promptDelete() {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.finaliseForm('DELETE');
        this.componentService.back();
      }
    });

    // TODO - Delete from server (?)
  }

  /**
   *
   * TODO - add tests
   */
  private async finaliseForm(action?: 'UPDATE' | 'DELETE' | 'IGNORE') {
    const afterJson = this.getFormEntryJson(this.formEntry?.xml);
    // Determine action to automatically take if exit unexpectedly
    if (!action) {
      const { enketoEntry, json: beforeJson } = this.formInitial.submission;
      const before = { json: beforeJson, xml: enketoEntry?.xml || '' };
      const after = { json: afterJson, xml: this.formEntry?.xml || '' };
      action = this.determineFinaliseAction({ before, after });
    }
    this.formFinalised = true;
    console.log('[FORM]', action, afterJson);
    if (action === 'DELETE') return this.submissionDoc.remove();
    if (action === 'UPDATE') {
      const patch: Partial<IFormSubmission> = {
        json: afterJson,
        enketoEntry: this.formEntry,
        _modified: new Date().toISOString(),
      };
      return this.submissionDoc.incrementalPatch(patch);
    }
    return;
  }

  /**
   * Determine what action to take when finalising form, possibilities:
   * DELETE - current data empty
   * IGNORE - form not interacted with
   * UPDATE - all other cases (TODO - could check if metadata only changed)
   */
  private determineFinaliseAction(data: {
    before: { xml: string; json: Record<string, any> };
    after: { xml: string; json: Record<string, any> };
  }): 'UPDATE' | 'DELETE' | 'IGNORE' {
    const { before, after } = data;
    // Empty form data, delete
    if (Object.keys(before.json).length === 0 && Object.keys(after.json).length === 0) return 'DELETE';
    // Form not interacted with, ignore
    if (!after.xml) return 'IGNORE';
    return 'UPDATE';
  }

  /**
   *
   */
  private getFormEntryJson(formXml = '') {
    if (formXml) {
      // json nested by entry id, e.g. {abcde: {name:'Joe'}}
      const entryJson = xmlToJson(formXml);
      const [id] = Object.keys(entryJson);
      return entryJson[id];
    }
    return {};
  }

  private async loadFormSubmission(id: string, submission: IFormSubmission) {
    const formMeta = await this.monitoringService.getForm(id);
    if (formMeta) {
      let { model } = formMeta.enketoDefinition;
      const { form } = formMeta.enketoDefinition;
      // replace the xml <instance>...</instance> content with the submission xml to load values
      if (submission.enketoEntry?.xml) {
        model = xmlNodeReplaceContent({ xml: model, tagname: 'instance', content: submission.enketoEntry.xml });
      }
      this.formInitial = { form, model, submission };
    }
  }

  private subscribeToRouteChanges() {
    this.route.params.pipe(takeUntil(this.componentDestroyed$)).subscribe(async (params) => {
      const { formId, submissionId } = params;
      if (formId !== this.formId) {
        this.formId = formId;
        if (submissionId) {
          const submissionDoc = await this.monitoringService.dbSubmissionsCollection.findOne(submissionId).exec();
          if (submissionDoc) {
            this.submissionDoc = submissionDoc;
            await this.loadFormSubmission(formId, submissionDoc._data);
          }
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
    // const koboService = new KoboService({ authToken: environment.koboAuthToken });
    // if (Capacitor.isNativePlatform()) {
    //   koboService.httpHandlers.req = (endpoint, options) => {
    //     return CapacitorHttp.request({ url: endpoint, ...(options as any) }).then(async (res) => ({
    //       status: res.status,
    //       text: res.data,
    //     }));
    //   };
    // }
  }
}
