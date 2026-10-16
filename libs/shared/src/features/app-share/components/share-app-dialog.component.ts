import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppDistributionService } from '@picsa/shared/services/native/app-distribution.service';

@Component({
  selector: 'picsa-share-app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressBarModule, PicsaTranslateModule],
  templateUrl: './share-app-dialog.component.html',
  styleUrl: './share-app-dialog.component.scss',
})
export class ShareAppDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ShareAppDialogComponent>);
  private clipboard = inject(Clipboard);

  public distribution = inject(AppDistributionService);

  public formattedSize = computed(() => {
    const meta = this.distribution.latestMeta();
    const cached = this.distribution.cached();
    const bytes = cached?.fileSize ?? meta?.fileSize ?? 0;
    if (!bytes) return '';
    if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  });

  async ngOnInit() {
    await this.distribution.checkLatest();
  }

  public close() {
    this.dialogRef.close(false);
  }

  public async download() {
    try {
      await this.distribution.downloadApk();
    } catch {
      return;
    }
  }

  public cancelDownload() {
    this.distribution.cancelDownload();
  }

  public async shareFile() {
    try {
      await this.distribution.shareCachedApk();
    } catch {
      return;
    }
  }

  public async shareLink() {
    await this.distribution.shareDownloadLink();
  }

  public copyDirectLink() {
    this.clipboard.copy(this.distribution.downloadUrl());
  }

  public async deleteDownload() {
    await this.distribution.clearCachedApk();
  }
}
