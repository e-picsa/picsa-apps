import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ISyncPushEntry } from '@picsa/shared/services/core/db_v2/db-sync.service';
import { arrayToHashmapArray, hashmapToArray } from '@picsa/utils';
import { Subject, takeUntil } from 'rxjs';

import { STATUS_ICONS } from '../../models';
import { IMonitoringForm } from '../../schema/forms';
import { IFormSubmission } from '../../schema/submissions';
import { MonitoringToolService } from '../../services/monitoring-tool.service';
import { AccessCodeDialogComponent } from '../access-code-dialog/access-code-dialog.component';

type ISyncStatus = {
  [status in ISyncPushEntry['_sync_push_status']]: {
    value: number;
    matIcon: string;
    id?: string;
  };
};

@Component({
  selector: 'monitoring-form-item',
  templateUrl: './form-item.component.html',
  styleUrls: ['./form-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormItemComponent implements OnInit, OnDestroy {
  @Input() form: IMonitoringForm;

  public syncStatusMap: ISyncStatus = {
    complete: { ...STATUS_ICONS.complete, value: 0 },
    ready: { ...STATUS_ICONS.ready, value: 0 },
    draft: { ...STATUS_ICONS.draft, value: 0 },
    failed: { ...STATUS_ICONS.failed, value: 0 },
  };

  private componentDestroyed$ = new Subject();

  constructor(
    private service: MonitoringToolService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
  ) {}

  public get syncStatus() {
    return hashmapToArray(this.syncStatusMap, 'id');
  }

  // Check if form is locked
  public get isLocked(): boolean {
    return !!this.form.access_code && !this.form.access_unlocked;
  }

  ngOnInit() {
    this.subscribeToSubmissionSummary();
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  // Handle form click when locked
  public async handleFormClick(event: Event) {
    if (this.isLocked) {
      event.preventDefault();
      event.stopPropagation();

      const dialogRef = this.dialog.open(AccessCodeDialogComponent, {
        width: '350px',
        data: { formTitle: this.form.title },
      });

      dialogRef.afterClosed().subscribe(async (code) => {
        if (code && code === this.form.access_code) {
          // Update the form to be unlocked
          await this.service.unlockForm(this.form._id);
          // Navigate to the form
          this.router.navigate(['view', this.form._id]);
        }
      });
    }
  }

  /** Subscribe to form submissions and summarise by status */
  private subscribeToSubmissionSummary() {
    const submissionsQuery = this.service.getFormSubmissionsQuery(this.form._id);
    submissionsQuery.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((docs) => {
      const submissions = docs.map((d) => d.toMutableJSON());
      const submissionsByStatus = arrayToHashmapArray<IFormSubmission>(submissions, '_sync_push_status');
      for (const status of Object.keys(this.syncStatusMap)) {
        this.syncStatusMap[status].value = submissionsByStatus[status]?.length || 0;
      }
      this.cdr.markForCheck();
    });
  }
}
