import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
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

@Component({
  selector: 'picsa-resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent implements OnInit {
  @Input() viewStyle: 'expanded' | 'default' = 'default';
  @Input() resource: IResource;

  actionButtonIcon: string;
  // isDownloading = false;
  // progress = 0;

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
    this.parent.actionButtonIcon = 'open_in_new';
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    this.parent.store.openBrowserLink(this.resource.url);
  }
}

class FileItemHandler {
  resource: IResourceFile;
  constructor(private parent: ResourceItemComponent) {
    this.resource = parent.resource as IResourceFile;
    parent.handleResourceClick = (e) => this.handleClick(e);
    this.handleOverrides();
  }
  private async handleOverrides() {
    const isDownloaded = this.parent.store.isFileDownloaded(this.resource);
    this.parent.actionButtonIcon = isDownloaded
      ? 'open_in_new'
      : 'file_download';
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    this.parent.store.openFileResource(this.resource);
    //   this.store.openResource(this.resource);
    // } else {
    //   this.isDownloading = true;
    //   this.store.downloadResource(this.resource).subscribe(
    //     (progress) => {
    //       console.log('progress', progress);
    //       this.progress = progress;
    //     },
    //     (err) => {
    //       this.isDownloading = false;
    //       throw err;
    //     },
    //     () => (this.isDownloading = false)
    //   );
    // }
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
    this.parent.actionButtonIcon = 'open_in_new';
  }

  private handleClick(e: Event) {
    e.stopPropagation();
    console.log('handle click', this.resource);
    const { appId } = this.resource;
    this.parent.store.openBrowserLink(
      `https://play.google.com/store/apps/details?id=${appId}`
    );
  }
}
