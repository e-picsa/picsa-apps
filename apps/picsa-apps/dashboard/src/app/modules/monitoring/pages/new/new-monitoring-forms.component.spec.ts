import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewMonitoringFormsComponent } from './new-monitoring-forms.component'

describe('NewTranslationsComponent', () => {
  let component: NewMonitoringFormsComponent;
  let fixture: ComponentFixture<NewMonitoringFormsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMonitoringFormsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewMonitoringFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
