import { Component, Input, OnInit } from '@angular/core';
import { MonitoringToolService } from '../../services/monitoring-tool.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IFormSubmission } from '../../schema/submissions';

@Component({
  selector: 'monitoring-response-list',
  templateUrl: './response-list.component.html',
  styleUrls: ['./response-list.component.scss'],
})
export class ResponseListComponent implements OnInit {
  @Input() formId: string;
  @Input() submissions: IFormSubmission[] = [];

  constructor(private service: MonitoringToolService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('hello response list');
  }

  public async createNewSubmission() {
    const { _id } = await this.service.createNewSubmission(this.formId);
    this.router.navigate([_id], { relativeTo: this.route });
  }
}
