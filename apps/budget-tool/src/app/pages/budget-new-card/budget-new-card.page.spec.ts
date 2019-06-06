import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetNewCardPage } from './budget-new-card.page';

describe('BudgetNewCardPage', () => {
  let component: BudgetNewCardPage;
  let fixture: ComponentFixture<BudgetNewCardPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BudgetNewCardPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetNewCardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
