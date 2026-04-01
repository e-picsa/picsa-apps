import { ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { BudgetStore } from './store/budget.store';

export const BUDGET_ROUTES: Routes = [
  {
    path: '',
    providers: [
      BudgetStore,
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useFactory: () => () => inject(BudgetStore).init(),
      },
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/budget-home.page').then((mod) => mod.BudgetHomePage),
        title: translateMarker('Budget Tool'),
      },
      {
        path: ':budgetKey',
        loadChildren: () => import('./pages/view/budget-view.module').then((mod) => mod.BudgetViewPageModule),
        data: {
          headerStyle: 'inverted',
        },
      },
    ],
  },
];
