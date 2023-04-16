import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PrivacyComponent } from './privacy.component';
import { PrivacyRoutingModule } from './privacy-routing.module';

@NgModule({
  declarations: [PrivacyComponent],
  imports: [CommonModule, PrivacyRoutingModule],
})
export class PrivacyModule {}
