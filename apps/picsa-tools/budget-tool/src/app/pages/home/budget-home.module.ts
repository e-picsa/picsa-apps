import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { MobxAngularModule } from 'mobx-angular';

import { BudgetToolComponentsModule } from '../../components/budget-tool.components';
import { BudgetMaterialModule } from '../../material.module';
import { BudgetHomePage } from './budget-home.page';
import { BudgetDrawComponent } from '../../components/budget-draw/budget-draw.component';

const routes: Routes = [
  {
    path: '',
    component: BudgetHomePage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    PicsaTranslateModule,
    PicsaDialogsModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule,
    BudgetDrawComponent
  ],
  declarations: [BudgetHomePage],
})
export class BudgetHomePageModule {}
