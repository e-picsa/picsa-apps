import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MonitoringToolService } from '../../../services/monitoring-tool.service';
import { IFormSubmission } from '../../../schema/submissions';
import { IMonitoringForm } from '../../../schema/forms';
import { PicsaCommonComponentsService } from '@picsa/components';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'monitoring-submission-list',
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.scss'],
})
export class SubmissionListComponent implements OnInit, OnDestroy {
  private form: IMonitoringForm;
  public submissionData = new MatTableDataSource<IFormSubmission>([]);
  public displayedColumns: string[] = [];
  public columnHeaders: string[] = [];

  private componentDestroyed$ = new Subject<boolean>();

  constructor(
    private service: MonitoringToolService,
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService
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

  private async loadForm(formId: string) {
    const form = await this.service.getForm(formId);
    if (form) {
      this.form = form;
      this.displayedColumns = form.summaryFields.map(({ field }) => field);
      this.columnHeaders = form.summaryFields.map(({ label }) => label);
      this.componentService.patchHeader({ title: form.title });
    }
  }

  private async loadSubmissions(formId: string) {
    // subscribe to form submission query to allow update following
    // form view ondestroy action (may have delay)
    const query = this.service.getFormSubmissionsQuery(formId);
    query.$.pipe(takeUntil(this.componentDestroyed$)).subscribe((data) => {
      const submissions = data.map((doc) => doc._data);
      this.submissionData.data = submissions;
    });
  }

  public async createNewSubmission() {
    const { _id } = await this.service.createNewSubmission(this.form?._id);
    this.router.navigate([_id], { relativeTo: this.route });
  }
}
