import { NgModule } from '@angular/core';
import { PicsaDialogLoading } from './dialogs';

// NOTE - to use this material dialogue must already have been imported elsewhere
@NgModule({
  entryComponents: [PicsaDialogLoading],
  declarations: [PicsaDialogLoading],
  exports: [PicsaDialogLoading]
})
export class PicsaDialogsModule {}

/*  TODO 

Create some sort of method/provider so that a selection of customisable (/injectable)
dialogs can be created on the fly

*/
