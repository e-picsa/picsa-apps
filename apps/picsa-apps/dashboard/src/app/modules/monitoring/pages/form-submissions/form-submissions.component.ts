import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

import { DashboardMaterialModule } from '../../../../material.module';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

export type IMonitoringSubmissionsRow = Database['public']['Tables']['monitoring_tool_submissions']['Row'];

@Component({
  selector: 'dashboard-form-submissions',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule,NgxJsonViewerModule,PicsaDataTableComponent],
  templateUrl: './form-submissions.component.html',
  styleUrls: ['./form-submissions.component.scss'],
})
export class FormSubmissionsComponent {
  public submissions: any[];
  dataLoadError: string;
  displayedColumns: string[];

  constructor(private service: MonitoringFormsDashboardService, private route: ActivatedRoute, private router: Router) {
    this.service.ready();
    this.route.params.subscribe((params) => {
      const id = params['slug'];
      service.forms.forEach((form)=>{
        if(form.device_form_id === id && form.summary_fields){
          this.displayedColumns = form.summary_fields.map((field) =>  { 
            if(field && field['field']) {
               return field['field'];
            }
            return
          });
        }
      })
      this.fetchSubmissions(id);
    });
  }
  public tableOptions: IDataTableOptions = {
    paginatorSizes: [25, 50]
  };

  async fetchSubmissions(id:string){
    const {data,error} = await this.service.getSubmissionsByLocalFormId(id);
    if(error){
      this.dataLoadError = 'Failed to fetch submitions';
    }else{
      this.submissions = data.map((submission) =>  { 
        if(submission.json) {
           return submission.json
        }
        return
      });
    }
  }

}
