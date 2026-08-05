import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FarmerShareFlowService } from '../share-flow/share-flow.service';

@Component({
  selector: 'farmer-content-share-whatsapp',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share-whatsapp.component.html',
  styleUrl: './share-whatsapp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareWhatsappComponent implements OnDestroy {
  private router = inject(Router);
  protected shareFlow = inject(FarmerShareFlowService);

  public readonly shareStatus = this.shareFlow.shareStatus;
  public readonly shareStatusLabel = this.shareFlow.shareStatusLabel;

  constructor() {
    this.shareFlow.enterShareFlow();
  }

  ngOnDestroy() {
    this.shareFlow.exitShareFlow();
  }

  public goBack() {
    this.router.navigate(['farmer', 'share', 'app']);
  }

  public goToVideoShare() {
    this.router.navigate(['farmer', 'share', 'videos'], { state: { shareVideosReturnTo: 'whatsapp' } });
  }
}
