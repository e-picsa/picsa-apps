import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';
import { PicsaDialogsModule } from '@picsa/shared/features';
import { ExtensionToolkitMaterialModule } from '../material.module';
import { LanguageSelectComponent } from './language-select/language-select';
import { LanguageSelectDialog } from './language-select/language-select-dialog';
import { UserGroupComponent } from './user-group/user-group';
import { WhatsappGroupComponent } from './whatsapp-group/whatsapp-group';

@NgModule({
  declarations: [
    UserGroupComponent,
    WhatsappGroupComponent,
    LanguageSelectComponent,
    LanguageSelectDialog,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PicsaTranslateModule,
    ExtensionToolkitMaterialModule,
    PicsaDialogsModule,
    ExtensionToolkitMaterialModule,
  ],
  exports: [
    UserGroupComponent,
    WhatsappGroupComponent,
    LanguageSelectComponent,
    LanguageSelectDialog,
  ],
})
export class ComponentsModule {}
