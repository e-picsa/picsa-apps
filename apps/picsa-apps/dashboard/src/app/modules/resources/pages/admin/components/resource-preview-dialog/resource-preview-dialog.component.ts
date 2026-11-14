import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DashboardMaterialModule } from '../../../../../../material.module';
import { IResourcePreviewDialogData } from './resource-preview-dialog.utils';

/** Only http(s) urls are granted inline preview - `external_url` values originate outside the upload pipeline */
const PREVIEWABLE_URL_PROTOCOL = /^https?:\/\//i;

/**
 * Read-only preview of a resource, mirroring the farmer-app experience.
 * Opened via `MatDialog` with immutable `MAT_DIALOG_DATA`.
 * All view state derives from pure `computed()`s over injected data -
 * no lifecycle hooks, no effects, no service dependencies.
 */
@Component({
  selector: 'dashboard-resource-preview-dialog',
  imports: [CommonModule, DashboardMaterialModule],
  templateUrl: './resource-preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePreviewDialogComponent {
  public readonly data = inject<IResourcePreviewDialogData>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Explicitly trusted resource url for iframe preview.
   * Angular requires `SafeResourceUrl` for iframe src (NG0904) - memoised in
   * a `computed` so the binding value stays referentially stable across
   * change detection passes. Trust is granted only to http(s) urls: file
   * `external_url` values are not settable via the dashboard form (display-only,
   * legacy/imported rows) but originate outside the upload pipeline, so anything
   * else returns null and the template falls back to the external link (which
   * keeps default href sanitization).
   */
  public safeFileUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.data.fileUrl ?? '';
    if (!PREVIEWABLE_URL_PROTOCOL.test(url)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  public showVideo = computed(() => this.data.fileKind === 'video' && !!this.data.fileUrl);
  public showPdf = computed(() => this.data.fileKind === 'pdf' && !!this.data.fileUrl);
  public showFileFallback = computed(
    () => this.data.kind === 'File' && !this.showVideo() && !this.showPdf() && !!this.data.fileUrl,
  );
}
