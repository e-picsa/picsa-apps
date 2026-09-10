import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FarmerContentHomeFabComponent } from '../share-flow/home-fab.component';
import { FarmerShareFlowService } from '../share-flow/share-flow.service';

@Component({
  selector: 'farmer-content-share-app',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule, FarmerContentHomeFabComponent],
  templateUrl: './share-app.component.html',
  styleUrl: './share-app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareAppComponent implements OnDestroy {
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
    this.router.navigate(['farmer', 'share']);
  }

  public shareViaBluetooth() {
    this.router.navigate(['farmer', 'share', 'bluetooth']);
  }

  public shareViaWhatsApp() {
    this.router.navigate(['farmer', 'share', 'whatsapp']);
  }
}
