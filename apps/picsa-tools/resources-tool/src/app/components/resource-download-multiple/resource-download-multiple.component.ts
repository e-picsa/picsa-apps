import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IResourceFile } from '@picsa/resources/schemas';
import { ResourcesDownloadService } from '@picsa/resources/services/resources-download.service';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import PQueue from 'p-queue';
import { RxDocument } from 'rxdb';

import { ResourceDownloadComponent } from '../resource-download/resource-download.component';

@Component({
  selector: 'resource-download-multiple',
  templateUrl: './resource-download-multiple.component.html',
  styleUrl: './resource-download-multiple.component.scss',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SizeMBPipe,
    PicsaTranslateModule,
    PicsaTranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Component to be used alongside `resource-download` to programatically trigger
 * download on all child components
 */
export class ResourceDownloadMultipleComponent {
  public status = signal<'ready' | 'downloading'>('ready');

  public pendingDownloadsSize = signal(0);

  public message = signal('');

  public docs = input.required<RxDocument<IResourceFile>[]>();

  private downloadService = inject(ResourcesDownloadService);

  constructor() {
    effect(() => {
      const status = this.status();
      if (status === 'downloading') return;
      const totalSize = this.calcTotalSize(this.docs());
      this.pendingDownloadsSize.set(totalSize);
    });
  }

  public async startDownload() {
    const docs = this.docs();
    this.status.set('downloading');
    const queue = await this.downloadService.queueMultiple(docs, 5);
    const total = docs.length;
    this.message.set(`0 / ${total}`);
    queue.on('next', () => {
      this.message.set(`${total - queue.pending - queue.size} / ${total}`);
    });
    await queue.onIdle();
    this.status.set('ready');
  }
  public stopDownload() {
    const docs = this.docs();
    docs.forEach(async (doc) => {
      const dlEntry = await this.downloadService.register(doc);
      dlEntry.cancel();
    });
  }

  private calcTotalSize(docs: RxDocument<IResourceFile>[]) {
    return docs.reduce((prev, current) => prev + current.size_kb || 0, 0);
  }
}
