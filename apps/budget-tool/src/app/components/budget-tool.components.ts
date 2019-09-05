import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { BudgetCardImageComponent } from './card/card-image/budget-card-image';
import { BudgetCardComponent } from './card/budget-card';
import { BudgetCellComponent } from './cell/cell';
import { BudgetTableComponent } from './table/budget-table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetMaterialModule } from '../material.module';
import { BudgetListItemComponent } from './list-item/budget-list-item';
import { BudgetCellLabourComponent } from './cell/variants/labour/labour';
import { BudgetCellEditorComponent } from './cell-editor/cell-editor';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaDbModule } from '@picsa/modules';
import {
  BudgetBalanceLegendComponent,
  BudgetBalanceEditorComponent
} from './balance/balance-legend/balance-legend';
import { BudgetCellEditorInputValuesComponent } from './cell-editor/input-values/input-values';
import { BudgetBalanceDotValueComponent } from './balance/balance-dot-value/dot-value';
import { BudgetCellEditorFamilyLabourComponent } from './cell-editor/family-labour/family-labour';
import { BudgetCellEditorProduceConsumedComponent } from './cell-editor/produce-consumed/produce-consumed';
import { BudgetCardNew, BudgetCardNewDialog } from './card/card-new/card-new';
import { RouterModule } from '@angular/router';
import { BudgetCellEditorCardSelectComponent } from './cell-editor/card-select/card-select';
import { NextButton } from './general/next-button';
import { BackButton } from './general/back-button';
import { BudgetPeriodSummaryComponent } from './summary/period-summary';

@NgModule({
  declarations: [
    BudgetBalanceLegendComponent,
    BudgetBalanceDotValueComponent,
    BudgetBalanceEditorComponent,
    BudgetCardComponent,
    BudgetCardImageComponent,
    BudgetCellComponent,
    BudgetCellEditorComponent,
    BudgetCellEditorCardSelectComponent,
    BudgetCellEditorInputValuesComponent,
    BudgetCellEditorFamilyLabourComponent,
    BudgetCellEditorProduceConsumedComponent,
    BudgetCellLabourComponent,
    BudgetCardNew,
    BudgetCardNewDialog,
    BudgetListItemComponent,
    BudgetPeriodSummaryComponent,
    BudgetTableComponent,
    BackButton,
    NextButton
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BudgetMaterialModule,
    TranslateModule.forChild(),
    CanvasWhiteboardModule,
    MobxAngularModule,
    PicsaDbModule,
    RouterModule
  ],
  exports: [
    BudgetBalanceLegendComponent,
    BudgetBalanceDotValueComponent,
    BudgetCardComponent,
    BudgetCardImageComponent,
    BudgetCellComponent,
    BudgetCellEditorComponent,
    BudgetCellEditorCardSelectComponent,
    BudgetCellEditorInputValuesComponent,
    BudgetCellEditorFamilyLabourComponent,
    BudgetCellEditorProduceConsumedComponent,
    BudgetCellLabourComponent,
    BudgetListItemComponent,
    BudgetCardNew,
    BudgetTableComponent,
    BudgetPeriodSummaryComponent,
    BackButton,
    NextButton
  ],
  entryComponents: [BudgetBalanceEditorComponent, BudgetCardNewDialog]
})
export class BudgetToolComponentsModule {}
