import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { PicsaConfigurationSummaryComponent } from '@picsa/configuration/src';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { PicsaScrollRestoreDirective } from '@picsa/shared/directives';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    PicsaConfigurationSummaryComponent,
    PicsaScrollRestoreDirective,
    PicsaTranslateModule,
    RouterModule,
  ],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
})
export class FarmerContentHomeComponent {
  public content = FARMER_CONTENT_DATA;
}
