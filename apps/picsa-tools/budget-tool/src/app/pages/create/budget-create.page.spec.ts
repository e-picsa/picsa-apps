import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { BudgetStore } from '../../store/budget.store';
import { BudgetCardService } from '../../store/budget-card.service';
import { BudgetCreatePage } from './budget-create.page';

describe('BudgetCreatePage', () => {
  let component: BudgetCreatePage;
  let fixture: ComponentFixture<BudgetCreatePage>;

  const mockBudgetStore = {
    createNewBudget: jest.fn(),
    activeBudget: {
      meta: {
        title: '',
        description: '',
        enterprise: { id: '', label: '', type: null, groupings: [], imgType: 'svg' },
        lengthScale: 'months',
        lengthTotal: 5,
        monthStart: 9,
        valueScale: 1,
      },
    },
    patchBudget: jest.fn(),
  };

  const mockBudgetCardService = {
    enterpriseGroups: [],
    dbCollection: {
      find: jest.fn().mockReturnValue({
        $: of([]),
      }),
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetCreatePage],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: BudgetStore, useValue: mockBudgetStore },
        { provide: BudgetCardService, useValue: mockBudgetCardService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BudgetCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
