import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourcesComponentsModule } from '../../components/components.module';
import { ResourcesMaterialModule } from '../../material.module';
import { SearchComponent } from './search.component';

const routes: Routes = [{ path: '', component: SearchComponent, title: 'Search' }];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    FormsModule,
    ResourcesMaterialModule,
    ResourcesComponentsModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
  ],
  exports: [RouterModule],
})
export class SearchModule {}
