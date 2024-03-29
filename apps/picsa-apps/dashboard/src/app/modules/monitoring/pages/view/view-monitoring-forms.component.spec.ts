import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMonitoringFormsComponent } from './view-monitoring-forms.component';

describe('ViewMonitoringFormsComponent', () => {
  let component: ViewMonitoringFormsComponent;
  let fixture: ComponentFixture<ViewMonitoringFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMonitoringFormsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewMonitoringFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
