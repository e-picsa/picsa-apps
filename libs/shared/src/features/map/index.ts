import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PicsaMapComponent } from './map';

@NgModule({
  declarations: [PicsaMapComponent],
  imports: [CommonModule, LeafletModule.forRoot()],
  exports: [PicsaMapComponent]
})
export class PicsaMapModule {}
