import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardClimateApiStatusComponent } from './api-status';

describe('DashboardClimateApiStatusComponent', () => {
  let component: DashboardClimateApiStatusComponent;
  let fixture: ComponentFixture<DashboardClimateApiStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardClimateApiStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardClimateApiStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
