import { inject, Injectable, signal } from '@angular/core';
import { Share } from '@capacitor/share';
import { PicsaCommonComponentsService } from '@picsa/components';

export type ShareFlowStatus = 'idle' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class FarmerShareFlowService {
  private componentsService = inject(PicsaCommonComponentsService);

  public readonly shareStatus = signal<ShareFlowStatus>('idle');
  public readonly shareStatusLabel = signal('');

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

  public shareAppInstallLink() {
    return this.runShareAction(() =>
      Share.share({
        title: 'E-PICSA App',
        text: 'Install the E-PICSA App',
        url: window.location.origin,
        dialogTitle: 'Share E-PICSA App',
      }),
    );
  }

  public async runShareAction(action: () => Promise<unknown>) {
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
