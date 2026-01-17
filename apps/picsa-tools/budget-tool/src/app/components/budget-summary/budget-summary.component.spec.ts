import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetSummaryComponent } from './budget-summary.component';

describe('BudgetSummaryComponent', () => {
  let component: BudgetSummaryComponent;
  let fixture: ComponentFixture<BudgetSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
