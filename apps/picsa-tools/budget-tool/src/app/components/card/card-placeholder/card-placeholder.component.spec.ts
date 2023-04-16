import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetCardPlaceholderComponent } from './card-placeholder.component';

describe('BudgetCardPlaceholderComponent', () => {
  let component: BudgetCardPlaceholderComponent;
  let fixture: ComponentFixture<BudgetCardPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BudgetCardPlaceholderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetCardPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
