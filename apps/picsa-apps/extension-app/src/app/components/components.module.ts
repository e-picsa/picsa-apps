import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ExtensionToolkitMaterialModule } from '../material.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PicsaTranslateModule,
    ExtensionToolkitMaterialModule,
    PicsaDialogsModule,
    ExtensionToolkitMaterialModule,
  ],
  exports: [],
})
export class ComponentsModule {}
