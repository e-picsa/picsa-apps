import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
// Import and register all custom elements for the module
import { defineCustomElements } from '@picsa/webcomponents/loader';

import { DIRECTIVES } from './generated';

defineCustomElements(window);

@NgModule({
  imports: [CommonModule],
  declarations: [...DIRECTIVES],
  exports: [...DIRECTIVES],
})
export class WebcomponentsNgxModule {}
