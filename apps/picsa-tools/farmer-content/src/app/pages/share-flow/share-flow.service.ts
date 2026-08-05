import { computed, inject, Injectable, signal } from '@angular/core';
import { PicsaCommonComponentsService } from '@picsa/components';

export type ShareFlowStatus = 'idle' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class FarmerShareFlowService {
  private componentsService = inject(PicsaCommonComponentsService);

  public readonly shareStatus = signal<ShareFlowStatus>('idle');
  public readonly shareStatusLabel = signal('');
  public readonly canShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');

  public enterShareFlow() {
    this.shareStatus.set('idle');
    this.shareStatusLabel.set('');
    this.componentsService.patchHeader({ hideHeader: true, hideBackButton: true });
  }

  public exitShareFlow() {
    this.componentsService.patchHeader({ hideHeader: false, hideBackButton: false });
  }

  public setShareError(message: string) {
    this.shareStatus.set('error');
    this.shareStatusLabel.set(message);
  }

  public setShareSuccess(message = 'Shared successfully') {
    this.shareStatus.set('success');
    this.shareStatusLabel.set(message);
  }

  public async shareAppInstallLink() {
    if (!this.canShare()) {
      this.setShareError('Sharing is not available on this device');
      return;
    }

    try {
      await navigator.share({
        title: 'E-PICSA App',
        text: 'Install the E-PICSA App',
        url: window.location.origin,
      });
      this.setShareSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.setShareError('Unable to share');
    }
  }

  public async runShareAction(action: () => Promise<void>) {
    if (!this.canShare()) {
      this.setShareError('Sharing is not available on this device');
      return;
    }

    try {
      await action();
      this.setShareSuccess();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.setShareError('Unable to share');
    }
  }
}
