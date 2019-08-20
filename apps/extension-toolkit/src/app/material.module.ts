import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatGridListModule],
  exports: [MatButtonModule, MatIconModule, MatCardModule, MatGridListModule]
})
export class ExtensionToolkitMaterialModule {}
