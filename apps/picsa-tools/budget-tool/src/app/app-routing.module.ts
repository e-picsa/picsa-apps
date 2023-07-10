import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/budget-home.module').then((mod) => mod.BudgetHomePageModule),
    title: translateMarker('Budget Tool'),
  },
  {
    path: 'create',
    loadChildren: () => import('./pages/create/budget-create.module').then((mod) => mod.BudgetCreatePageModule),
    title: translateMarker('New Budget'),
  },
  {
    path: 'view',
    redirectTo: '/',
    pathMatch: 'full',
  },
  {
    path: 'view/:budgetKey',
    loadChildren: () => import('./pages/view/budget-view.module').then((mod) => mod.BudgetViewPageModule),
    data: {
      headerStyle: 'inverted',
    },
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...ROUTES_COMMON, ...ROUTES_STANDALONE], {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
