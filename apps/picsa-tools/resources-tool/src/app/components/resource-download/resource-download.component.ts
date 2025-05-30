import { ChangeDetectionStrategy, Component, effect, Input, input, OnDestroy, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { RxDocument } from 'rxdb';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { IDownloadStatus, ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, SizeMBPipe],
})
export class ResourceDownloadComponent implements OnDestroy {
  public downloadStatus = signal<IDownloadStatus>('loading');
  public downloadProgress = signal(0);

  /** Generated fileURI of downloaded file */
  public fileURI = signal<string | null>(null);

  /** File URI emitter */
  fileDownloaded = output<string>();

  private download$?: Subscription;
  private componentDestroyed$ = new Subject();

  /** Show size text */
  @Input() showSize: boolean;

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  private dbDoc = signal<RxDocument<IResourceFile> | undefined>(undefined);

  resource = input.required<IResourceFile>();

  constructor(private service: ResourcesToolService) {
    effect(async () => {
      const resource = this.resource();
      this.loadDBDoc(resource);
    });
    // Emit whenever file download complete/retrieved and URI available for use
    effect(() => {
      const fileURI = this.fileURI();
      if (fileURI) {
        this.fileDownloaded.emit(fileURI);
      }
    });
  }

  private async loadDBDoc(resource: IResourceFile) {
    await this.service.ready();
    const dbDoc = await this.service.dbFiles.findOne(resource.id).exec();
    if (dbDoc) {
      this.dbDoc.set(dbDoc);
      this.subscribeToAttachmentChanges(dbDoc);
    }
  }

  public get sizePx() {
    return `${this.size}px`;
  }

  private subscribeToAttachmentChanges(dbDoc: RxDocument<IResourceFile>) {
    // subscribe to doc attachment changes to confirm whether downloaded
    dbDoc.allAttachments$.pipe(takeUntil(this.componentDestroyed$)).subscribe((attachments) => {
      const attachment = attachments.find((a) => a.id === this.resource().filename);
      // TODO - check if update available
      this.downloadStatus.set(attachment ? 'complete' : 'ready');
      this.generateFileURI(dbDoc);
    });
  }
  private async generateFileURI(dbDoc: RxDocument<IResourceFile>) {
    // avoiding converting to web url as will usually be opened natively (e.g. external open, native video)
    const convertNativeSrc = false;
    const uri = await this.service.getFileAttachmentURI(dbDoc, convertNativeSrc);
    this.fileURI.set(uri);
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public downloadResource() {
    const doc = this.dbDoc();
    if (doc) {
      const { download$, progress$, status$ } = this.service.triggerResourceDownload(doc);
      progress$.subscribe((progress) => {
        this.downloadProgress.set(progress);
      });
      status$.subscribe((status) => {
        this.downloadStatus.set(status);
      });
      this.download$ = download$;
    }
  }

  /** Cancel ongoing download */
  public cancelDownload() {
    this.downloadStatus.set('ready');
    if (this.download$) {
      this.download$.unsubscribe();
      this.download$ = undefined;
      this.downloadProgress.set(0);
    }
  }
}
