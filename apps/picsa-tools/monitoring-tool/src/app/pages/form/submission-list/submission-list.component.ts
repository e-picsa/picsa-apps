import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MonitoringToolService } from '../../../services/monitoring-tool.service';
import { IFormSubmission } from '../../../schema/submissions';
import { IMonitoringForm } from '../../../schema/forms';
import { PicsaCommonComponentsService } from '@picsa/components';

@Component({
  selector: 'monitoring-submission-list',
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.scss'],
})
export class SubmissionListComponent implements OnInit {
  private form: IMonitoringForm;
  public submissions: IFormSubmission[] = [];

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
      await this.loadSubmissions(formId);
    }
    console.log({ form: this.form, submissions: this.submissions });
  }
  private async loadForm(formId: string) {
    const form = await this.service.getForm(formId);
    if (form) {
      this.form = form;
      this.componentService.patchHeader({ title: form.title });
    }
  }
  private async loadSubmissions(formId: string) {
    this.submissions = await this.service.getFormSubmissions(formId);
  }

  public async createNewSubmission() {
    const { _id } = await this.service.createNewSubmission(this.form?._id);
    this.router.navigate([_id], { relativeTo: this.route });
  }
}
