import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const commonRoutes: Routes = [
  // { path: '', redirectTo: '/home', pathMatch: 'full' },
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
  }
];
const standaloneRoutes: Routes = [
  // { path: '**', redirectTo: 'home' }
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...commonRoutes, ...standaloneRoutes], {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

/*******************************************************************
 *  Embedded Version (requires standalone imports in master app)
 ******************************************************************/
@NgModule({
  imports: [RouterModule.forChild(commonRoutes)],
  exports: [RouterModule]
})
export class BudgetToolRoutingModule {
  constructor() {
    console.log('budget tool constructor', commonRoutes);
  }
}
