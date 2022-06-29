import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BudgetViewPage } from './budget-view.page';
import { BudgetMaterialModule } from '../../material.module';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { BudgetToolComponentsModule } from '../../components/budget-tool.components';

const routes: Routes = [
  {
    path: '',
    component: BudgetViewPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    BudgetMaterialModule,
    BudgetToolComponentsModule,
    MobxAngularModule,
  ],
  declarations: [BudgetViewPage],
})
export class BudgetViewPageModule {}
