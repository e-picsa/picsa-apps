import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ResourcesPage } from './resources.page';
import { NgxYoutubePlayerModule } from 'ngx-youtube-player';
import { PicsaTranslateModule } from '@picsa/modules';

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
    IonicModule,
    RouterModule.forChild(routes),
    NgxYoutubePlayerModule,
    PicsaTranslateModule
  ],
  declarations: [ResourcesPage]
})
export class ResourcesPageModule {}
