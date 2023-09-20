import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';

import { IResource, IResourceFile, IResourceType } from '../../models';
import { ResourcesStore } from '../../stores';
import { AppItemHandler } from './templates/app';
import { CollectionItemHandler } from './templates/collection/collection';
import { FileItemHandler } from './templates/file';
import { LinkItemHandler } from './templates/link';
import { VideoItemHandler } from './templates/video';

type IResourceClickHandlers = {
  [type in IResourceType]: (resource: any) => void;
};
interface IActionButton {
  icon: 'open_in_new' | 'file_download' | 'tab' | 'picsa_play_store' | 'play_arrow';
  /** Specify TRUE if using custom registered icon */
  svgIcon?: boolean;
}

@Component({
  selector: 'resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent implements OnInit {
  @Input() viewStyle: 'expanded' | 'default' = 'default';
  @Input() resource: IResource;

  @Input() openAfterDownload = true;

  @Output() downloadComplete = new EventEmitter<IResourceFile>();

  public actionButton?: IActionButton;

  public downloadProgress?: number;

  public subtitle = '';

  private inputHandlers: IResourceClickHandlers = {
    collection: () => new CollectionItemHandler(this),
    file: () => new FileItemHandler(this),
    youtube: () => null,
    link: () => new LinkItemHandler(this),
    app: () => new AppItemHandler(this),
    video: () => new FileItemHandler(this),
  };

  public handleResourceClick: (e: Event) => void = (e) => e.stopPropagation();

  constructor(
    public store: ResourcesStore,
    public translateService: PicsaTranslateService,
    public router: Router,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    const inputHandler = this.inputHandlers[this.resource.type];
    if (inputHandler) {
      inputHandler(this.resource);
    }
  }
}
