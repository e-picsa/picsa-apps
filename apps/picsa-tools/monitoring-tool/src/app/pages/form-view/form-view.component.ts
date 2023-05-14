import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MonitoringToolService } from '../../services/monitoring-tool.service';

@Component({
  selector: 'monitoring-form-view',
  templateUrl: './form-view.component.html',
  styleUrls: ['./form-view.component.scss'],
})
export class FormViewComponent implements OnInit, OnDestroy {
  public formHtml: string;
  public formXml: string;
  public showForm = true;

  private componentDestroyed$ = new Subject<boolean>();

  constructor(private route: ActivatedRoute, private monitoringService: MonitoringToolService) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  ngOnInit(): void {
    this.subscribeToRouteChanges();
  }

  public saveForm(data: any) {
    // TODO
    console.log('save form', data);
  }

  public autosave(data: any) {
    // TODO
    console.log('saving draft', data);
  }

  private loadForm(id: string) {
    const loadedForm = this.monitoringService.getForm(id);
    if (loadedForm) {
      this.formHtml = loadedForm.form;
      this.formXml = loadedForm.model;
      this.showForm = true;
    }
  }

  private subscribeToRouteChanges() {
    this.route.params.pipe(takeUntil(this.componentDestroyed$)).subscribe((params) => {
      console.log('params', params);
      const { formId } = params;
      if (formId) {
        this.loadForm(formId);
      }
    });
  }
}
