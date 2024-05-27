import {
  // ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subject, Subscription, takeUntil } from 'rxjs';

import { IResourceFile, IResourceLink } from '../../schemas';
import {  ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-share',
  templateUrl: './resource-share.component.html',
  styleUrls: ['./resource-share.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceShareComponent implements OnDestroy {
  // public downloadStatus: IDownloadStatus;
  // public downloadProgress = 0;
  public attachment?: RxAttachment<IResourceFile>;

  private _dbDoc: RxDocument<IResourceFile>;
  private _dbLink: IResourceLink;
  // private download$?: Subscription;
  private componentDestroyed$ = new Subject();
  
  @Input() styleVariant: 'primary' | 'white' = 'primary';
  // type of resourse
  @Input() resourceType: 'file' | 'link';

  @Input() set dbDoc(dbDoc: RxDocument<IResourceFile>) {
    this._dbDoc = dbDoc;
    // if (dbDoc) {
    //   this.subscribeToAttachmentChanges(dbDoc);
    // }
  }
   //for when we have a link
  @Input() set dbLink(dbLink: IResourceLink) {
    console.log(dbLink)
    this._dbLink = dbLink;
    // if (dbDoc) {
    //   this.subscribeToAttachmentChanges(dbDoc);
    // }
  }

  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}
  
  public get resource() {
    return this._dbDoc._data;
  }

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
  public async shareDocument() {
    if(this.resourceType==='file'){
      this.service.shareResourse(this._dbDoc)
    }
  }
}
