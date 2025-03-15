import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ISyncPushEntry } from '@picsa/shared/services/core/db_v2/db-sync.service';
import { arrayToHashmapArray, hashmapToArray } from '@picsa/utils';
import { Subject, takeUntil } from 'rxjs';

import { STATUS_ICONS } from '../../models';
import { IMonitoringForm } from '../../schema/forms';
import { IFormSubmission } from '../../schema/submissions';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

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

  constructor(private service: MonitoringToolService, private cdr: ChangeDetectorRef) {}

  public get syncStatus() {
    return hashmapToArray(this.syncStatusMap, 'id');
  }

  ngOnInit() {
    this.subscribeToSubmissionSummary();
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
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
