import { MatButtonModule, MatCardModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  exports: [MatButtonModule, MatIconModule, MatCardModule]
})
export class PicsaMaterialModule {}
