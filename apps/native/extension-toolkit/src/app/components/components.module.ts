import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { PicsaDialogsModule } from '@picsa/features';
import { ExtensionToolkitMaterialModule } from '../material.module';
import { LanguageSelectComponent } from './language-select/language-select';
import { UserGroupComponent } from './user-group/user-group';
import { WhatsappGroupComponent } from './whatsapp-group/whatsapp-group';
import { ResourceItemComponent } from './resource-item/resource-item';

@NgModule({
  declarations: [
    UserGroupComponent,
    WhatsappGroupComponent,
    LanguageSelectComponent,
    ResourceItemComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PicsaTranslateModule,
    ExtensionToolkitMaterialModule,
    PicsaDialogsModule,
    ExtensionToolkitMaterialModule
  ],
  exports: [
    UserGroupComponent,
    WhatsappGroupComponent,
    LanguageSelectComponent,
    ResourceItemComponent
  ]
})
export class ComponentsModule {}
