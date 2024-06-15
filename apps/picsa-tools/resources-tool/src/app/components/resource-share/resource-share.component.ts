import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
} from '@angular/core';
import { RxAttachment, RxDocument } from 'rxdb';
import { Subject} from 'rxjs';

import { IResourceFile, IResourceLink } from '../../schemas';
import {  ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-share',
  templateUrl: './resource-share.component.html',
  styleUrls: ['./resource-share.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceShareComponent implements OnDestroy {

  public attachment?: RxAttachment<IResourceFile>;

  private _dbDoc: RxDocument<IResourceFile>;
  private _dbLink: IResourceLink;

  private componentDestroyed$ = new Subject();
  
  @Input() styleVariant: 'primary' | 'white' = 'primary';
  // type of resourse
  @Input() resourceType: 'file' | 'link';

  @Input() set dbDoc(dbDoc: RxDocument<IResourceFile>) {
    this._dbDoc = dbDoc;
  }
   //for when we have a link
  @Input() set dbLink(dbLink: IResourceLink) {
    this._dbLink = dbLink;
  }

  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}
  

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }
  public async shareDocument() {
      this.service.shareResource(this._dbDoc,this.resourceType)
  }
}
