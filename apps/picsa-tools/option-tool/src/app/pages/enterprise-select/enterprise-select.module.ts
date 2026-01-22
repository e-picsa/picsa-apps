import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { OptionToolComponentsModule } from '../../components/components.module';
import { EnterpriseSelectComponent } from './enterprise-select.component';

const routes: Routes = [
  {
    path: '',
    component: EnterpriseSelectComponent,
  },
];

@NgModule({
  declarations: [EnterpriseSelectComponent],
  imports: [CommonModule, RouterModule.forChild(routes), OptionToolComponentsModule, PicsaTranslateModule],
})
export class EnterpriseSelectModule {}
