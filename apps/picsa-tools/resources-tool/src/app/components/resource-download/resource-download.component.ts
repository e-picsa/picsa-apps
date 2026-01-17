import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';

import { IResourceFile } from '../../schemas';
import { DownloadEntry, ResourcesDownloadService } from '../../services/resources-download.service';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, SizeMBPipe],
})
export class ResourceDownloadComponent implements OnDestroy {
  private service = inject(ResourcesToolService);
  private downloadService = inject(ResourcesDownloadService);

  public downloadStatus = computed(() => this.downloader()?.status());
  public downloadProgress = computed(() => this.downloader()?.progress() || 0);

  downloadStatusChange = output<string | undefined>();

  /** Show size text */
  @Input() showSize: boolean;

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  private dbDoc = signal<RxDocument<IResourceFile> | undefined>(undefined);

  resource = input.required<IResourceFile>();

  private downloader = signal<DownloadEntry | undefined>(undefined);

  constructor() {
    effect(async () => {
      const resource = this.resource();
      // load db doc when input resource changes
      if (resource.id !== this.dbDoc()?.id) {
        await this.loadDBDoc(resource);
      }
    });

    effect(() => {
      const status = this.downloadStatus();
      this.downloadStatusChange.emit(status);
    });

    // Create download manager bindings when db doc loaded
    effect(async () => {
      const doc = this.dbDoc();
      if (doc) {
        const downloader = await this.downloadService.register(doc);
        this.downloader.set(downloader);
      }
    });
  }
  ngOnDestroy(): void {
    this.downloadService.unregister(this.dbDoc()?.id);
  }

  private async loadDBDoc(resource: IResourceFile) {
    await this.service.ready();
    const dbDoc = await this.service.dbFiles.findOne(resource.id).exec();
    if (dbDoc) {
      this.dbDoc.set(dbDoc);
    }
  }

  public async download(e: Event) {
    e.stopImmediatePropagation();
    return this.downloader()?.download();
  }

  /** Cancel ongoing download */
  public cancelDownload(e: Event) {
    e.stopImmediatePropagation();
    return this.downloader()?.cancel();
  }

  public uri(convertNativeSrc = false) {
    return this.downloader()?.uri(convertNativeSrc);
  }

  public get sizePx() {
    return `${this.size}px`;
  }
}
