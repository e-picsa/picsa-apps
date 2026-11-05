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

  it('steps back one month and emits the change', () => {
    const emitted: Date[] = [];
    component.dateChanged.subscribe((date) => emitted.push(date));
    const before = component.dateSelected();
    component.stepMonth(-1);
    const expected = new Date(before.getFullYear(), before.getMonth() - 1, 1);
    expect(component.dateSelected()).toEqual(expected);
    expect(emitted).toEqual([expected]);
  });

  it('does not step into the future', () => {
    const emitted: Date[] = [];
    component.dateChanged.subscribe((date) => emitted.push(date));
    const before = component.dateSelected();
    expect(component.canNext()).toBe(false);
    component.stepMonth(1);
    expect(component.dateSelected()).toEqual(before);
    expect(emitted).toEqual([]);
  });

  it('does not step before the minimum month', () => {
    const emitted: Date[] = [];
    component.dateChanged.subscribe((date) => emitted.push(date));
    component.dateSelected.set(new Date(component.minDate));
    expect(component.canPrevious()).toBe(false);
    component.stepMonth(-1);
    expect(component.dateSelected()).toEqual(new Date(component.minDate));
    expect(emitted).toEqual([]);
  });
});
