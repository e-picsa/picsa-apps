import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetViewPage } from './budget-view.page';

describe('BudgetViewPage', () => {
  let component: BudgetViewPage;
  let fixture: ComponentFixture<BudgetViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BudgetViewPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
