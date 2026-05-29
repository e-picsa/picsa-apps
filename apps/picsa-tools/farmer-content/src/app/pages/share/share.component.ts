import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'farmer-content-share',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareComponent implements OnDestroy {
  private router = inject(Router);
  private componentsService = inject(PicsaCommonComponentsService);

  constructor() {
    this.componentsService.patchHeader({ hideHeader: true, hideBackButton: true });
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({ hideHeader: false, hideBackButton: false });
  }

  public goBack() {
    this.router.navigate(['farmer']);
  }

  public selectInstalledAnswer(hasAppInstalled: boolean) {
    if (hasAppInstalled) {
      this.router.navigate(['farmer', 'share', 'videos']);
      return;
    }
    this.router.navigate(['farmer', 'share', 'app']);
  }
}
