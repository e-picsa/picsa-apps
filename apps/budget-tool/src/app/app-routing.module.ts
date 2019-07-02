import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/budget-home.module').then(
        mod => mod.BudgetHomePageModule
      )
  },
  {
    path: 'create',
    loadChildren: () =>
      import('./pages/create/budget-create.module').then(
        mod => mod.BudgetCreatePageModule
      )
  },
  {
    path: 'view',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'view/:budgetKey',
    loadChildren: () =>
      import('./pages/view/budget-view.module').then(
        mod => mod.BudgetViewPageModule
      )
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
