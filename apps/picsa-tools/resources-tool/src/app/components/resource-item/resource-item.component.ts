import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { Subscription } from 'rxjs';

import {
  IResource,
  IResourceApp,
  IResourceCollection,
  IResourceFile,
  IResourceLink,
  IResourceType,
} from '../../models';
import { ResourcesStore } from '../../stores';

type IResourceClickHandlers = {
  [type in IResourceType]: (resource: any) => void;
};
interface IActionButton {
  icon: 'open_in_new' | 'file_download' | 'tab' | 'picsa_play_store';
  /** Specify TRUE if using custom registered icon */
  svgIcon?: boolean;
}

@Component({
  selector: 'picsa-resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent implements OnInit {
  @Input() viewStyle: 'expanded' | 'default' = 'default';
  @Input() resource: IResource;

  public actionButton?: IActionButton;
  public downloadProgress?: number;

  public subtitle = '';

  private inputHandlers: IResourceClickHandlers = {
    collection: () => new CollectionItemHandler(this),
    file: () => new FileItemHandler(this),
    youtube: () => null,
    link: () => new LinkItemHandler(this),
    app: () => new AppItemHandler(this),
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
    console.log('resource', this.resource);
  }
}

class LinkItemHandler {
  resource: IResourceLink;
  constructor(private parent: ResourceItemComponent) {
    this.resource = parent.resource as IResourceLink;
    parent.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    this.parent.actionButton = {
      icon: (this.resource.icon as any) || 'tab',
    };
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    this.parent.store.openBrowserLink(this.resource.url);
  }
}

class FileItemHandler {
  private download$?: Subscription;
  resource: IResourceFile;
  constructor(private parent: ResourceItemComponent) {
    this.resource = parent.resource as IResourceFile;
    parent.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    const isDownloaded = this.parent.store.isFileDownloaded(this.resource);
    this.parent.actionButton = {
      icon: isDownloaded ? 'open_in_new' : 'file_download',
    }; // TODO show file download size alongside download icon
  }

  private async handleClick(e: Event) {
    e.stopPropagation();
    if (this.download$) {
      return this.cancelDownload();
    }
    const isDownloaded = this.parent.store.isFileDownloaded(this.resource);
    if (!isDownloaded) {
      this.handleResourceDownload();
    } else {
      this.parent.store.openFileResource(this.resource);
    }
  }
  /** Cancel ongoing download */
  private cancelDownload() {
    if (this.download$) {
      this.download$.unsubscribe();
      this.download$ = undefined;
      this.parent.downloadProgress = undefined;
      this.parent.actionButton = { icon: 'file_download' };
    }
  }

  private handleResourceDownload() {
    this.parent.actionButton = undefined;
    this.parent.downloadProgress = 0;
    this.parent.store.downloadResource(this.resource).subscribe({
      next: ({ progress, subscription }) => {
        this.download$ = subscription;
        this.parent.downloadProgress = progress;
      },
      error: (err) => {
        console.error(err);
        this.parent.downloadProgress = undefined;
        this.parent.actionButton = { icon: 'file_download' };
        // TODO - show error message
        throw err;
      },
      complete: () => {
        this.parent.downloadProgress = undefined;
        this.parent.actionButton = { icon: 'open_in_new' };
        this.parent.store.openFileResource(this.resource);
      },
    });
  }
}

class CollectionItemHandler {
  resource: IResourceCollection;
  constructor(private parent: ResourceItemComponent) {
    this.resource = parent.resource as IResourceCollection;
    parent.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }

  private async handleOverrides() {
    const { translateService } = this.parent;
    const resource = this.resource as IResourceCollection;
    const suffix = await translateService.translateText('Resources');
    this.parent.subtitle = `${resource.childResources.length} ${suffix}`;
  }

  private handleClick(e: Event) {
    if (this.parent.viewStyle === 'expanded') return;
    e.stopPropagation();
    const { route, router } = this.parent;
    // Route from one collection to another
    if (route.snapshot.paramMap.get('collectionId')) {
      router.navigate([this.resource._key], {
        relativeTo: route,
      });
    }
    // Route from base to collection
    else {
      router.navigate(['collection', this.resource._key], {
        relativeTo: route,
      });
    }
  }
}

class AppItemHandler {
  resource: IResourceApp;
  constructor(private parent: ResourceItemComponent) {
    this.resource = parent.resource as IResourceApp;
    parent.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    this.parent.actionButton = { icon: 'picsa_play_store', svgIcon: true };
    console.log('app item', this.parent);
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    const { appId } = this.resource;
    this.parent.store.openBrowserLink(`https://play.google.com/store/apps/details?id=${appId}`);
  }
}
