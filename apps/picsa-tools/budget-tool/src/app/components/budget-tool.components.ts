import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaDbModule } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';

import { BudgetMaterialModule } from '../material.module';
// Components
import { BudgetCellEditorComponent } from './_deprecated/cell-editor';
import { BudgetCellEditorInputValuesComponent } from './_deprecated/input-values/input-values';
import { NextButton } from './_deprecated/next-button';
import { BudgetBalanceDotValueComponent } from './balance/balance-dot-value/dot-value';
import {
  BudgetBalanceEditorComponent,
  BudgetBalanceLegendComponent,
} from './balance/balance-legend/balance-legend';
import { BudgetCardComponent } from './card/budget-card';
import { BudgetCardImageComponent } from './card/card-image/budget-card-image';
import { BudgetCardNew } from './card/card-new/card-new';
import { BudgetCardNewDialog } from './card/card-new/card-new-dialog';
import { BudgetCardPlaceholderComponent } from './card/card-placeholder/card-placeholder.component';
import { BudgetCellComponent } from './cell/cell';
import { BudgetCellLabourComponent } from './cell/variants/labour/labour';
import { BudgetCardEditorComponent } from './editor/card-editor/card-editor.component';
import { BudgetCellEditorCardSelectComponent } from './editor/card-select/card-select';
import { BudgetCellEditorFamilyLabourComponent } from './editor/card-select/family-labour/family-labour';
import { BudgetCellEditorProduceConsumedComponent } from './editor/card-select/produce-consumed/produce-consumed';
import { BudgetEditorComponent } from './editor/editor.component';
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
  BudgetCardEditorComponent,
  BudgetCardImageComponent,
  BudgetCardPlaceholderComponent,
  BudgetCellComponent,
  BudgetCellEditorComponent,
  BudgetCellEditorCardSelectComponent,
  BudgetCellEditorInputValuesComponent,
  BudgetCellEditorFamilyLabourComponent,
  BudgetCellEditorProduceConsumedComponent,
  BudgetEditorComponent,
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
