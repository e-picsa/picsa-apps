import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardClimateMonthSelectComponent } from './month-select.component';

describe('MonthSelectComponent', () => {
  let component: DashboardClimateMonthSelectComponent;
  let fixture: ComponentFixture<DashboardClimateMonthSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardClimateMonthSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardClimateMonthSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
