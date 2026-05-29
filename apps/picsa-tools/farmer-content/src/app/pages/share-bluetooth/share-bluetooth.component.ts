import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'farmer-content-share-bluetooth',
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share-bluetooth.component.html',
  styleUrl: './share-bluetooth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareBluetoothComponent implements OnDestroy {
  private router = inject(Router);
  private componentsService = inject(PicsaCommonComponentsService);

  public readonly shareStatus = signal<'idle' | 'success' | 'error'>('idle');
  public readonly shareStatusLabel = signal('');
  public readonly canShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');

  constructor() {
    this.componentsService.patchHeader({ hideHeader: true, hideBackButton: true });
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({ hideHeader: false, hideBackButton: false });
  }

  public goBack() {
    this.router.navigate(['farmer', 'share', 'app']);
  }

  public goToVideoShare() {
    this.router.navigate(['farmer', 'share', 'videos'], { state: { shareVideosReturnTo: 'bluetooth' } });
  }

  public async shareAppApk() {
    if (!this.canShare()) {
      this.shareStatus.set('error');
      this.shareStatusLabel.set('Sharing is not available on this device');
      return;
    }

    try {
      // Placeholder until APK file path is wired from release artifacts.
      await navigator.share({
        title: 'E-PICSA App',
        text: 'Install the E-PICSA App',
        url: window.location.origin,
      });
      this.shareStatus.set('success');
      this.shareStatusLabel.set('Shared successfully');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.shareStatus.set('error');
      this.shareStatusLabel.set('Unable to share');
    }
  }
}
