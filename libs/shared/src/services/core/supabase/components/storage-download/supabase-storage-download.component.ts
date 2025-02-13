import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import ky, { KyResponse } from 'ky';
import { BehaviorSubject, filter, firstValueFrom, map } from 'rxjs';

import { SupabaseService } from '../../supabase.service';

/**
 * Component to handle downloading of a file from supabase storage
 * NOTE - it does not render any UI elements itself, but can access
 * download `progress()` signal to display custom UI
 *
 * @example
 * ```html
 * <picsa-supabase-storage-download #dl>
 *   <span>Progress: {{progress()}}<span>
 * </picsa-supabase-storage-download>
 * ```
 */
@Component({
  selector: 'picsa-supabase-storage-download',
  imports: [CommonModule],
  templateUrl: './supabase-storage-download.component.html',
  styleUrl: './supabase-storage-download.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupabaseStorageDownloadComponent {
  /** Storage file path */
  storage_path = input.required<string>();

  /** Signal of download progress */
  public progress = signal<number | undefined>(undefined);

  /** Promise that resolves when download is complete */
  public completed = () =>
    firstValueFrom(
      this.completed$.pipe(
        filter((v) => v === true),
        map(() => ({ error: this.error, data: this.data }))
      )
    );

  // Internals
  private controller: AbortController;
  private error: any;
  private completed$: BehaviorSubject<boolean>;
  private data: Blob | Record<string, any>;

  constructor(private service: SupabaseService) {}

  public async start() {
    this.progress.set(0);
    this.completed$ = new BehaviorSubject(false);

    await this.service.ready();
    const [bucketId, ...pathSegments] = this.storage_path().split('/');
    const url = this.service.storage.getPublicLink(bucketId, pathSegments.join('/'));
    const controller = new AbortController();
    return ky(url, {
      signal: controller.signal,
      onDownloadProgress: (progress) => {
        this.progress.set(progress.percent);
      },
    }).then(
      async (res) => {
        this.data = await this.getResData(res);
        this.completed$.next(true);
      },
      (err) => {
        console.error(err);
        this.error = err;
        this.completed$.next(true);
      }
    );
  }

  public stop() {
    if (this.controller) {
      this.controller.abort();
    }
  }

  private async getResData(res: KyResponse<any>) {
    const contentType = res.headers.get('content-type');
    // TODO - support more content types (possibly via input)
    if (contentType === 'application/json') {
      return res.json() as Record<string, any>;
    }
    return res.blob();
  }
}
