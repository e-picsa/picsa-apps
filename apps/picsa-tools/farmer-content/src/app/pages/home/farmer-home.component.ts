import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaScrollRestoreDirective } from '@picsa/shared/directives';
import { DynamicColourSvgsComponent, SvgColourSelectorComponent } from '@picsa/shared/features/dynamic-colour-svgs';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-home',
  standalone: true,
  imports: [
    MatButtonModule,
    DynamicColourSvgsComponent,
    SvgColourSelectorComponent,
    FormsModule,
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
