import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateMonitoringFormsComponent } from './update-monitoring-forms.component'

describe('UpdateMonitoringFormsComponent', () => {
  let component: UpdateMonitoringFormsComponent;
  let fixture: ComponentFixture<UpdateMonitoringFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateMonitoringFormsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateMonitoringFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
