import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'farmer-content-share',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareComponent {
  private router = inject(Router);

  public selectInstalledAnswer(hasAppInstalled: boolean) {
    if (hasAppInstalled) {
      this.router.navigate(['farmer', 'share', 'videos']);
      return;
    }
    this.router.navigate(['farmer', 'share', 'app']);
  }
}
