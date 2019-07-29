import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // { path: '', redirectTo: '/budget/home', pathMatch: 'full' },
  {
    path: 'budget/home',
    loadChildren: () =>
      import('./pages/home/budget-home.module').then(
        mod => mod.BudgetHomePageModule
      )
  },
  {
    path: 'budget/create',
    loadChildren: () =>
      import('./pages/create/budget-create.module').then(
        mod => mod.BudgetCreatePageModule
      )
  },
  {
    path: 'budget/view',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'budget/view/:budgetKey',
    loadChildren: () =>
      import('./pages/view/budget-view.module').then(
        mod => mod.BudgetViewPageModule
      )
  },
  { path: 'budget', redirectTo: 'budget/home' },
  { path: '**', redirectTo: 'budget/home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
