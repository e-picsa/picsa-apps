import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { PicsaDialogService } from '@picsa/shared/features';
import { xmlNodeReplaceContent, xmlToJson } from '@picsa/utils';
import type { IEnketoFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { AccessCodeDialogComponent } from '../../../components/access-code-dialog/access-code-dialog.component';
import { IMonitoringForm } from '../../../schema/forms';
import { IFormSubmission } from '../../../schema/submissions';
import { MonitoringToolService } from '../../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
  standalone: false,
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
  private currentForm: IMonitoringForm;
  private isLoadingForm = false;

  /** Track if form has already had finalisation action (e.g. update/delete) */
  private formFinalised = false;

  private formInteracted = false;

  /** DB doc linked to current submission entry */
  private submissionDoc: RxDocument<IFormSubmission>;
  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private monitoringService: MonitoringToolService,
    private componentService: PicsaCommonComponentsService,
    private dialogService: PicsaDialogService,
    private dialog: MatDialog
  ) {}

  // Track user activity to reset inactivity timer
  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:touchstart')
  onUserActivity() {
    if (this.formId && this.currentForm?.access_code) {
      this.monitoringService.resetAutoLockTimer(this.formId);
    }
  }

  async ngOnDestroy() {
    await this.handleViewDestroy();

    // Clear any active lock timers when component is destroyed
    if (this.formId) {
      this.monitoringService.clearAutoLockTimer(this.formId);
    }

    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
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
    this.formInteracted = true;
    const entry = (e as any).detail as IEnketoFormEntry;
    this.formEntry = entry;

    // Reset inactivity timer on autosave (counts as user activity)
    if (this.formId && this.currentForm?.access_code) {
      this.monitoringService.resetAutoLockTimer(this.formId);
    }
  }

  public async promptDelete() {
    const dialog = await this.dialogService.open('delete');
    dialog.afterClosed().subscribe(async (shouldDelete) => {
      if (shouldDelete) {
        await this.finaliseForm('DELETE');
        this.componentService.back();
      }
    });
  }

  private async handleViewDestroy() {
    // Check whether outstanding data requires saving/deleting
    if (!this.formFinalised) {
      const action = this.determineFormAction();
      // save as draft if data updated
      if (action === 'UPDATE') {
        this.formEntry!.draft = true;
      }
      await this.finaliseForm(action);
    }
  }

  /**
   * Determine what action to take when finalising form, possibilities:
   * DELETE - current data empty
   * IGNORE - form not interacted with
   * UPDATE - all other cases (TODO - could check if metadata only changed)
   */
  private determineFormAction(): 'UPDATE' | 'DELETE' | 'IGNORE' {
    const afterJson = this.getFormEntryJson(this.formEntry?.xml);
    const { enketoEntry, json: beforeJson } = this.formInitial.submission;
    const before = { json: beforeJson, xml: enketoEntry?.xml || '' };
    const after = { json: afterJson, xml: this.formEntry?.xml || '' };
    // Empty form data, delete
    if (Object.keys(before.json).length === 0 && Object.keys(after.json).length === 0) return 'DELETE';
    // Form not interacted with, ignore
    if (!this.formInteracted) return 'IGNORE';
    return 'UPDATE';
  }

  private async finaliseForm(action: 'UPDATE' | 'DELETE' | 'IGNORE') {
    const afterJson = this.getFormEntryJson(this.formEntry?.xml);

    this.formFinalised = true;
    console.log('[FORM]', action, afterJson);
    if (action === 'DELETE') return this.submissionDoc.remove();
    if (action === 'UPDATE') {
      const patch: Partial<IFormSubmission> = {
        json: afterJson,
        enketoEntry: this.formEntry,
        _modified: new Date().toISOString(),
        _sync_push_status: this.formEntry?.draft ? 'draft' : 'ready',
      };
      return this.submissionDoc.incrementalPatch(patch);
    }
    return;
  }

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
      this.currentForm = formMeta;

      // Check if form is locked and redirect if necessary
      if (this.isFormLocked(formMeta)) {
        this.promptForAccessCode(formMeta);
        return;
      }

      let { model } = formMeta.enketoDefinition;
      const { form } = formMeta.enketoDefinition;
      // replace the xml <instance>...</instance> content with the submission xml to load values
      if (submission.enketoEntry?.xml) {
        model = xmlNodeReplaceContent({ xml: model, tagname: 'instance', content: submission.enketoEntry.xml });
      }
      this.formEntry = submission.enketoEntry;
      this.formInitial = { form, model, submission };

      // Start inactivity timer if the form has an access code
      if (formMeta.access_code) {
        this.monitoringService.resetAutoLockTimer(id);
      }
    }
  }

  private isFormLocked(form: IMonitoringForm): boolean {
    return !!form.access_code && !form.access_unlocked;
  }

  private promptForAccessCode(form: IMonitoringForm) {
    if (this.isLoadingForm) return;
    this.isLoadingForm = true;

    const dialogRef = this.dialog.open(AccessCodeDialogComponent, {
      width: '350px',
      data: { formTitle: form.title },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(async (code) => {
      this.isLoadingForm = false;
      if (code && code === form.access_code) {
        // Update the form to be unlocked
        await this.monitoringService.unlockForm(form._id);
        // Reload the page to load the form
        window.location.reload();
      } else {
        // Navigate back to home if canceled or wrong code
        this.router.navigate(['/']);
      }
    });
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
}
