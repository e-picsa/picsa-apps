import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { OptionListComponent } from './option-list.component';

const routes: Routes = [
  {
    path: '',
    component: OptionListComponent,
  },
];

@NgModule({
  declarations: [OptionListComponent],
  imports: [CommonModule, RouterModule.forChild(routes), PicsaTranslateModule],
})
export class OptionListModule {}
