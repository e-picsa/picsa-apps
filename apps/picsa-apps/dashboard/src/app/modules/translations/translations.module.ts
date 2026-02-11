import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslationsFeature } from './translations.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(TranslationsFeature.ROUTES)],
})
export class TranslationsPageModule {}
