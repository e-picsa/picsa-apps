import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaDbModule } from '@picsa/shared/modules';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaCommonComponentsModule } from '@picsa/components';

import { BudgetMaterialModule } from '../material.module';

// Components
import { BudgetCellEditorComponent } from './_deprecated/cell-editor';
import { NextButton } from './_deprecated/next-button';
import { BudgetBalanceDotValueComponent } from './balance/balance-dot-value/dot-value';
import {
  BudgetBalanceLegendComponent,
  BudgetBalanceEditorComponent,
} from './balance/balance-legend/balance-legend';
import { BudgetCardComponent } from './card/budget-card';
import { BudgetCardImageComponent } from './card/card-image/budget-card-image';
import { BudgetCardNew, BudgetCardNewDialog } from './card/card-new/card-new';
import { BudgetCellComponent } from './cell/cell';
import { BudgetCellLabourComponent } from './cell/variants/labour/labour';
import { BudgetCellEditorCardSelectComponent } from './cell-editor/card-select/card-select';
import { BudgetCellEditorInputValuesComponent } from './cell-editor/input-values/input-values';
import { BudgetCellEditorFamilyLabourComponent } from './cell-editor/family-labour/family-labour';
import { BudgetCellEditorProduceConsumedComponent } from './cell-editor/produce-consumed/produce-consumed';
import { BudgetCellInlineEditorComponent } from './cell-inline-editor/cell-inline-editor.component';
import { BudgetImportDialogComponent } from './import-dialog/import-dialog.component';
import {
  BudgetListItemComponent,
  BudgetListItemRenameDialog,
} from './list-item/budget-list-item';
import { BudgetShareDialogComponent } from './share-dialog/share-dialog.component';
import { BudgetPeriodSummaryComponent } from './summary/period-summary';
import { BudgetTableComponent } from './table/budget-table';

const components = [
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
  BudgetCellInlineEditorComponent,
  BudgetCellLabourComponent,
  BudgetCardNew,
  BudgetCardNewDialog,
  BudgetImportDialogComponent,
  BudgetListItemComponent,
  BudgetListItemRenameDialog,
  BudgetPeriodSummaryComponent,
  BudgetShareDialogComponent,
  BudgetTableComponent,
  NextButton,
];

@NgModule({
  declarations: components,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BudgetMaterialModule,
    TranslateModule.forChild(),
    PicsaDialogsModule,
    PicsaCommonComponentsModule,
    CanvasWhiteboardModule,
    MobxAngularModule,
    PicsaDbModule,
    RouterModule,
  ],
  exports: components,
})
export class BudgetToolComponentsModule {}
