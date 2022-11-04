import { Component, OnInit } from '@angular/core';
import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'picsa-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
/**
 *
 * https://github.dev/enketo/enketo-core
 */
export class HomeComponent implements OnInit {
  constructor(private monitoringToolService: MonitoringToolService) {}
  public formHtml: string;
  public formXml: string;
  public showForm = true;

  ngOnInit() {
    const loadedForm = this.monitoringToolService.getForm('PGpldp9m');
    if (loadedForm) {
      console.log(loadedForm);
      this.formHtml = loadedForm.form;
      this.formXml = loadedForm.model;
      this.showForm = true;
    }
  }
}
