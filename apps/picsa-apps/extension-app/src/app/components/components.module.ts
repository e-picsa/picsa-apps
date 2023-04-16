import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ExtensionToolkitMaterialModule } from '../material.module';
import { UserGroupComponent } from './user-group/user-group';
import { WhatsappGroupComponent } from './whatsapp-group/whatsapp-group';

@NgModule({
  declarations: [UserGroupComponent, WhatsappGroupComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PicsaTranslateModule,
    ExtensionToolkitMaterialModule,
    PicsaDialogsModule,
    ExtensionToolkitMaterialModule,
  ],
  exports: [UserGroupComponent, WhatsappGroupComponent],
})
export class ComponentsModule {}
