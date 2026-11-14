import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';

import { DashboardMaterialModule } from '../../../../../../material.module';
import { IResourcePreviewDialogData } from './resource-preview-dialog.utils';

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
  public data = inject<IResourcePreviewDialogData>(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);

  /**
   * Explicitly trusted resource url for iframe preview.
   * Angular requires `SafeResourceUrl` for iframe src (NG0904) - memoised in
   * a `computed` so the binding value stays referentially stable across
   * change detection passes. Urls originate from Supabase public storage or
   * admin-curated external links, matching the trust already given to the
   * open-in-new-tab anchors.
   */
  public safeFileUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.data.fileUrl ?? ''));

  public showVideo = computed(() => this.data.fileKind === 'video' && !!this.data.fileUrl);
  public showPdf = computed(() => this.data.fileKind === 'pdf' && !!this.data.fileUrl);
  public showFileFallback = computed(
    () => this.data.kind === 'File' && !this.showVideo() && !this.showPdf() && !!this.data.fileUrl,
  );
}
