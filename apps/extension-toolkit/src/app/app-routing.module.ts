import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '../../../budget-tool/src/app/app.module';

const routes: Routes = [
  // { path: '', redirectTo: '/budget', pathMatch: 'full' },
  // support embed of budget tool app
  {
    path: 'budget',
    loadChildren: () =>
      import('../../../budget-tool/src/app/app.module').then(
        mod => mod.BudgetToolModule
      )
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.module').then(mod => mod.HomePageModule)
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes
      // CC Note - strategy fails with embedded sub-apps (not sure why), could add custom strategy
      // , { preloadingStrategy: PreloadAllModules }
    ),
    BudgetToolModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
