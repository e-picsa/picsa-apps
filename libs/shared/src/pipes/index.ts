import { NgModule } from '@angular/core';

import { ObjectValuesPipe } from './objectValues';

const Pipes = [ObjectValuesPipe];

@NgModule({
  imports: [],
  exports: Pipes,
  declarations: Pipes,
  providers: [],
})
export class PicsaSharedPipesModule {}
