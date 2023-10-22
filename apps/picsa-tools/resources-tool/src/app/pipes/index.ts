import { NgModule } from '@angular/core';

import { SizeMBPipe } from './sizeMB';

@NgModule({
  exports: [SizeMBPipe],
  declarations: [SizeMBPipe],
})
export class ResourcesPipesModule {}
