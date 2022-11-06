import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIRECTIVES } from './generated';

// Import and register all custom elements for the module
import { defineCustomElements } from '@picsa/webcomponents/loader';

defineCustomElements(window);

@NgModule({
  imports: [CommonModule],
  declarations: [...DIRECTIVES],
  exports: [...DIRECTIVES],
})
export class WebcomponentsNgxModule {}
