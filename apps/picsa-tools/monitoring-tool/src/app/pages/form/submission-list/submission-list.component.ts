import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { Subject, takeUntil } from 'rxjs';

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
  private service = inject(MonitoringToolService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private componentService = inject(PicsaCommonComponentsService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

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

  async ngOnInit(): Promise<void> {
    await this.service.ready();
    const { formId } = this.route.snapshot.params;
    if (formId) {
      this.formId = formId;
      this.isLoading.set(true);

      await this.loadForm(formId);
      if (this.form) {
        // Check if form is locked - navigate back to home if locked
        if (this.isFormLocked(this.form)) {
          this.router.navigate(['../../'], { relativeTo: this.route });
        }

        await this.loadSubmissions(formId);
      }

      this.isLoading.set(false);
    }
  }

  async ngOnDestroy(): Promise<void> {
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
      this.isLoading.set(false);
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
}
