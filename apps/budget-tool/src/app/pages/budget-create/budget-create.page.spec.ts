import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetCreatePage } from './budget-create.page';

describe('BudgetCreatePage', () => {
  let component: BudgetCreatePage;
  let fixture: ComponentFixture<BudgetCreatePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BudgetCreatePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
