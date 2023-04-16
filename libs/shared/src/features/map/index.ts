import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { PicsaMapComponent } from './map';

@NgModule({
  declarations: [PicsaMapComponent],
  imports: [CommonModule, LeafletModule],
  exports: [PicsaMapComponent],
})
export class PicsaMapModule {}
