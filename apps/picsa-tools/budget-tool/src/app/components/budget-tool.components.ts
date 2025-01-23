import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaDialogsModule, PicsaDrawingComponent } from '@picsa/shared/features';
import { PicsaDbModule } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';

import { BudgetMaterialModule } from '../material.module';
// Components
import { BudgetBalanceDotValueComponent } from './balance/balance-dot-value/dot-value';
import { BudgetBalanceLegendComponent } from './balance/balance-legend/balance-legend';
import { BudgetSummaryComponent } from './budget-summary/budget-summary.component';
import { BudgetCardComponent } from './card/budget-card';
import { BudgetCardImageComponent } from './card/card-image/budget-card-image';
import { BudgetCardNew } from './card/card-new/card-new';
import { BudgetCardNewDialog } from './card/card-new/card-new-dialog';
import { BudgetCardPlaceholderComponent } from './card/card-placeholder/card-placeholder.component';
import { BudgetCellComponent } from './cell/cell';
import { BudgetCardEditorComponent } from './editor/card-editor/card-editor.component';
import { BudgetCellEditorCardSelectComponent } from './editor/card-select/card-select';
import { BudgetCellEditorFamilyLabourComponent } from './editor/card-select/family-labour/family-labour';
import { BudgetEditorComponent } from './editor/editor.component';
import { BudgetEditorSidebarComponent } from './editor-sidebar/editor-sidebar.component';
import { BudgetImportDialogComponent } from './import-dialog/import-dialog.component';
import { BudgetListItemComponent, BudgetListItemRenameDialog } from './list-item/budget-list-item';
import { BudgetShareDialogComponent } from './share-dialog/share-dialog.component';
import { BudgetPeriodSummaryComponent } from './summary/period-summary';
import { BudgetTableComponent } from './table/budget-table';

const components = [
  BudgetBalanceLegendComponent,
  BudgetBalanceDotValueComponent,
  BudgetCardComponent,
  BudgetCardEditorComponent,
  BudgetCardImageComponent,
  BudgetCardPlaceholderComponent,
  BudgetCellComponent,
  BudgetCellEditorCardSelectComponent,
  BudgetCellEditorFamilyLabourComponent,
  BudgetEditorComponent,
  BudgetEditorSidebarComponent,
  BudgetCardNew,
  BudgetCardNewDialog,
  BudgetImportDialogComponent,
  BudgetListItemComponent,
  BudgetListItemRenameDialog,
  BudgetPeriodSummaryComponent,
  BudgetShareDialogComponent,
  BudgetTableComponent,
  BudgetSummaryComponent,
];

@NgModule({
  declarations: components,
  imports: [
    CommonModule,
    FormsModule,
    BudgetMaterialModule,
    TranslateModule.forChild(),
    PicsaDialogsModule,
    PicsaCommonComponentsModule,
    MobxAngularModule,
    PicsaDbModule,
    RouterModule,
    MatTooltipModule,
    MatIconModule,
    PicsaDrawingComponent,
  ],
  exports: components,
})
export class BudgetToolComponentsModule {}
