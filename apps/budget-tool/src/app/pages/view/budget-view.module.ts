import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { BudgetViewPage } from './budget-view.page';
import { TranslateSharedLazyModuleModule } from '@picsa/core';

const routes: Routes = [
  {
    path: '',
    component: BudgetViewPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateSharedLazyModuleModule
  ],
  declarations: [BudgetViewPage]
})
export class BudgetViewPageModule {}
