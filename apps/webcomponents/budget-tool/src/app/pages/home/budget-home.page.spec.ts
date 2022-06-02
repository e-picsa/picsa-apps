import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetHomePage } from './budget-home.page';

describe('BudgetHomePage', () => {
  let component: BudgetHomePage;
  let fixture: ComponentFixture<BudgetHomePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BudgetHomePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
