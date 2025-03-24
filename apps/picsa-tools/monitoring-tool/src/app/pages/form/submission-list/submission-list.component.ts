import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { Subject, takeUntil } from 'rxjs';

import { AccessCodeDialogComponent } from '../../../components/access-code-dialog/access-code-dialog.component';
import { STATUS_ICONS } from '../../../models';
import { IMonitoringForm } from '../../../schema/forms';
import { IFormSubmission } from '../../../schema/submissions';
import { MonitoringToolService } from '../../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-submission-list',
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SubmissionListComponent implements OnInit, OnDestroy {
  public submissionData = new MatTableDataSource<IFormSubmission>([]);
  public displayedColumns: string[] = [];
  public displayedColumnsMeta: IMonitoringForm['summaryFields'] = [];
  public dataSourceColumns: string[] = [];

  public statusIcons = STATUS_ICONS;

  private componentDestroyed$ = new Subject<boolean>();
  private form: IMonitoringForm;
  private formId: string;
  private isLoadingForm = false;

  constructor(
    private service: MonitoringToolService,
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  // Track user activity to reset inactivity timer
  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:touchstart')
  onUserActivity() {
    if (this.formId && this.form?.access_code) {
      this.service.resetAutoLockTimer(this.formId);
    }
  }

  async ngOnInit() {
    await this.service.ready();
    const { formId } = this.route.snapshot.params;
    if (formId) {
      this.formId = formId;
      await this.loadForm(formId);
      if (this.form) {
        // Check if form is locked
        if (this.isFormLocked(this.form)) {
          this.promptForAccessCode(this.form);
          return;
        }

        // Start inactivity timer if form has an access code
        if (this.form.access_code) {
          this.service.resetAutoLockTimer(formId);
        }

        await this.loadSubmissions(formId);
      }
    }
  }

  async ngOnDestroy() {
    // Clear any active lock timers when component is destroyed
    if (this.formId && this.form?.access_code) {
      this.service.clearAutoLockTimer(this.formId);
    }

    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  private async loadForm(formId: string) {
    const form = await this.service.getForm(formId);
    if (form) {
      this.form = form;
      const { summaryFields } = form;
      this.displayedColumnsMeta = summaryFields;
      this.displayedColumns = summaryFields.map(({ field }) => field);
      this.dataSourceColumns = [...this.displayedColumns, '_sync_push_status'];
      this.componentService.patchHeader({ title: form.title });
      this.cdr.markForCheck();
    }
  }

  private async loadSubmissions(formId: string) {
    // subscribe to form submission query to allow update following
    // form view ondestroy action (may have delay)
    const query = this.service.getFormSubmissionsQuery(formId);
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((data) => {
      const submissions = data.map((doc) => doc.toMutableJSON());
      this.submissionData.data = submissions;
      this.cdr.markForCheck();
    });
  }

  public async createNewSubmission() {
    const { _id } = await this.service.createNewSubmission(this.form?._id);
    this.router.navigate([_id], { relativeTo: this.route });
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
        await this.service.unlockForm(form._id);
        window.location.reload();
      } else {
        return;
      }
    });
  }
}
