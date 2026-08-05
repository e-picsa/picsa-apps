import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FarmerShareFlowService } from '../share-flow/share-flow.service';

@Component({
  selector: 'farmer-content-share',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareComponent implements OnDestroy {
  private router = inject(Router);
  private shareFlow = inject(FarmerShareFlowService);

  constructor() {
    this.shareFlow.enterShareFlow();
  }

  ngOnDestroy() {
    this.shareFlow.exitShareFlow();
  }

  public goBack() {
    this.router.navigate(['farmer']);
  }

  public selectInstalledAnswer(hasAppInstalled: boolean) {
    if (hasAppInstalled) {
      this.router.navigate(['farmer', 'share', 'videos'], { state: { shareVideosReturnTo: 'share' } });
      return;
    }
    this.router.navigate(['farmer', 'share', 'app']);
  }
}
