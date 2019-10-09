import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { ResourcesPage } from './resources.page';
import { NgxYoutubePlayerModule } from 'ngx-youtube-player';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { MobxAngularModule } from 'mobx-angular';
import { ExtensionToolkitMaterialModule } from '../../material.module';
import { ComponentsModule } from '../../components/components.module';
import { PicsaCommonComponentsModule } from '@picsa/components';

const routes: Routes = [
  {
    path: '',
    component: ResourcesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    NgxYoutubePlayerModule,
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    MobxAngularModule,
    ExtensionToolkitMaterialModule
  ],
  declarations: [ResourcesPage]
})
export class ResourcesPageModule {}
