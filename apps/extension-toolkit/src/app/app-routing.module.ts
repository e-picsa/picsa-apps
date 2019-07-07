import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BudgetToolModule } from '../../../budget-tool/src/app/app.module';

const routes: Routes = [
  // { path: '', redirectTo: '/budget', pathMatch: 'full' },
  {
    path: 'budget',
    loadChildren: () =>
      import('../../../budget-tool/src/app/app.module').then(
        mod => mod.BudgetToolModule
      )
  },
  { path: '**', redirectTo: '/budget/home' }
  // { path: '**', redirectTo: '/budget' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes
      // , { preloadingStrategy: PreloadAllModules }
    ),
    BudgetToolModule.forRoot()
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
