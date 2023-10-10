import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
})
export class SubmissionListComponent implements OnInit, OnDestroy {
  public submissionData = new MatTableDataSource<IFormSubmission>([]);
  public displayedColumns: string[] = [];
  public displayedColumnsMeta: IMonitoringForm['summaryFields'] = [];

  public statusIcons = STATUS_ICONS;

  private componentDestroyed$ = new Subject<boolean>();
  private form: IMonitoringForm;

  constructor(
    private service: MonitoringToolService,
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.service.ready();
    const { formId } = this.route.snapshot.params;
    if (formId) {
      await this.loadForm(formId);
      if (this.form) {
        await this.loadSubmissions(formId);
      }
    }
  }

  async ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public get dataSourceColumns() {
    return [...this.displayedColumns, '_supabase_push_status'];
  }

  private async loadForm(formId: string) {
    const form = await this.service.getForm(formId);
    if (form) {
      this.form = form;
      const { summaryFields } = form;
      this.displayedColumnsMeta = summaryFields;
      this.displayedColumns = summaryFields.map(({ field }) => field);
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
}
