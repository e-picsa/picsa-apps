import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaScrollRestoreDirective } from '@picsa/shared/directives';

@Component({
  selector: 'farmer-home',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    PicsaScrollRestoreDirective,
    PicsaTranslateModule,
    RouterModule,
  ],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
  animations: [FadeInOut()],
})
export class FarmerContentHomeComponent {
  public content = FARMER_CONTENT_DATA;
}
