import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { IResourceFile } from '../../schemas';
import { IDownloadStatus, ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDownloadComponent implements OnDestroy {
  public downloadStatus: IDownloadStatus;
  public downloadProgress = 0;
  public attachment?: RxAttachment<IResourceFile>;

  private _dbDoc: RxDocument<IResourceFile>;
  private download$?: Subscription;
  private componentDestroyed$ = new Subject();

  /** Show size text */
  @Input() showSize: boolean;

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  @Input() set dbDoc(dbDoc: RxDocument<IResourceFile>) {
    this._dbDoc = dbDoc;
    if (dbDoc) {
      this.subscribeToAttachmentChanges(dbDoc);
    }
  }

  @Input() hideOnComplete = false;

  /** Emit downloaded file updates */
  @Output() attachmentChange = new EventEmitter<RxAttachment<IResourceFile> | undefined>();

  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}

  public get sizePx() {
    return `${this.size}px`;
  }

  public get resource() {
    return this._dbDoc._data;
  }

  private subscribeToAttachmentChanges(dbDoc: RxDocument<IResourceFile>) {
    // subscribe to doc attachment changes to confirm whether downloaded
    dbDoc.allAttachments$.pipe(takeUntil(this.componentDestroyed$)).subscribe((attachments) => {
      const attachment = attachments.find((a) => a.id === this.resource.filename);
      // TODO - check if update available
      this.downloadStatus = attachment ? 'complete' : 'ready';
      this.attachment = attachment;
      this.attachmentChange.next(attachment);
    });
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  public downloadResource() {
    const { download$, progress$, status$ } = this.service.triggerResourceDownload(this._dbDoc);
    progress$.subscribe((progress) => {
      this.downloadProgress = progress;
      this.cdr.markForCheck();
    });
    status$.subscribe((status) => {
      this.downloadStatus = status;
      this.cdr.markForCheck();
    });
    this.download$ = download$;
  }

  /** Cancel ongoing download */
  public cancelDownload() {
    this.downloadStatus = 'ready';
    if (this.download$) {
      this.download$.unsubscribe();
      this.download$ = undefined;
      this.downloadProgress = 0;
    }
  }
}
