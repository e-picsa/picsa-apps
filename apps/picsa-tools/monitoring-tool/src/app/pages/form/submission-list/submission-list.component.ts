import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { Subject, takeUntil } from 'rxjs';

import {
  AccessCodeDialogComponent,
  AccessCodeDialogResult,
} from '../../../components/access-code-dialog/access-code-dialog.component';
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
  public isLoading = signal(true);
  public isEmpty = signal(false);

  private componentDestroyed$ = new Subject<void>();
  private form: IMonitoringForm | null = null;
  private formId = '';

  constructor(
    private service: MonitoringToolService,
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  // Track user activity to reset inactivity timer
  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:touchstart')
  onUserActivity(): void {
    if (this.formId && this.form?.access_code) {
      this.service.resetAutoLockTimer(this.formId);
    }
  }

  async ngOnInit(): Promise<void> {
    await this.service.ready();
    const { formId } = this.route.snapshot.params;
    if (formId) {
      this.formId = formId;
      this.isLoading.set(true);

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

      this.isLoading.set(false);
    }
  }

  async ngOnDestroy(): Promise<void> {
    // Clear any active lock timers when component is destroyed
    if (this.formId && this.form?.access_code) {
      this.service.clearAutoLockTimer(this.formId);
    }

    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }

  private async loadForm(formId: string): Promise<void> {
    const form = await this.service.getForm(formId);
    if (form) {
      this.form = form;
      const { summaryFields } = form;
      this.displayedColumnsMeta = summaryFields;
      this.displayedColumns = summaryFields.map(({ field }) => field);
      this.dataSourceColumns = [...this.displayedColumns, '_sync_push_status'];
      this.componentService.patchHeader({ title: form.title });
      this.cdr.markForCheck();
    } else {
      this.snackBar.open('Form not found', 'Close', {
        duration: 3000,
      });
      this.router.navigate(['/']);
    }
  }

  private async loadSubmissions(formId: string): Promise<void> {
    // subscribe to form submission query to allow update following
    // form view ondestroy action (may have delay)
    const query = this.service.getFormSubmissionsQuery(formId);
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((data) => {
      const submissions = data.map((doc) => doc.toMutableJSON());
      this.submissionData.data = submissions;
      this.isEmpty.set(submissions.length === 0);
      this.cdr.markForCheck();
    });
  }

  public async createNewSubmission(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (!this.form?._id) {
        throw new Error('Form ID not available');
      }
      const submission = await this.service.createNewSubmission(this.form._id);
      // Navigate to the new submission
      this.router.navigate([submission._id], { relativeTo: this.route });
    } catch (error) {
      console.error('Error creating submission:', error);
      this.snackBar.open('Error creating new submission', 'Close', {
        duration: 3000,
      });
      this.isLoading.set(false);
    }
  }

  private isFormLocked(form: IMonitoringForm): boolean {
    return !!form.access_code && !form.access_unlocked;
  }

  private promptForAccessCode(form: IMonitoringForm): void {
    const dialogRef = this.dialog.open(AccessCodeDialogComponent, {
      width: '350px',
      data: {
        formTitle: form.title,
        accessCode: form.access_code || '',
      },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(async (result: AccessCodeDialogResult) => {
      if (result?.success) {
        try {
          // Update the form to be unlocked
          await this.service.unlockForm(form._id);

          // Show success message
          this.snackBar.open('Form unlocked successfully', 'Close', {
            duration: 3000,
          });

          await this.loadSubmissions(form._id);
          this.isLoading.set(false);
        } catch (error) {
          console.error('Error unlocking form:', error);
          this.snackBar.open('Error unlocking form', 'Close', {
            duration: 3000,
          });
          return;
        }
      } else {
        return;
      }
    });
  }
}
