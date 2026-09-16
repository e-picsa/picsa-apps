import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FeedbackFeature } from './feedback.routes';

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(FeedbackFeature.ROUTES)],
})
export class FeedbackModule {}
