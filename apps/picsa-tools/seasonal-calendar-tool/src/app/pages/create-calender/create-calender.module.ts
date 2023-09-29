import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Route, RouterModule } from '@angular/router';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { CreateCalenderComponent } from './create-calender.component';

const routes: Route[] = [
  {
    path: '',
    component: CreateCalenderComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    FormsModule,
    PicsaVideoPlayerModule,
    MatButtonModule,
  ],
  exports: [],
  declarations: [CreateCalenderComponent],
  providers: [],
})
export class CreateCalenderModule {}
