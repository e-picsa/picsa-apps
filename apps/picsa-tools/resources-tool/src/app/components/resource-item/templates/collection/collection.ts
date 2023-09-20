import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IResource, IResourceCollection, IResourceItemBase } from '../../../../models';
import { ResourcesStore } from '../../../../stores';
import { ResourceItemComponent } from '../../resource-item.component';

@Component({
  selector: 'resource-item-collection',
  templateUrl: 'collection.html',
  styleUrls: ['collection.scss'],
})
export class ResourceItemCollectionComponent implements OnInit {
  public resources: IResource[] = [];

  @Input() viewStyle: 'summary' | 'expanded' = 'summary';

  @Input() collection: IResourceCollection;
  constructor(private store: ResourcesStore, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.resources = this.collection.childResources
      .map((resourceId) => this.store.getResourceById(resourceId))
      .sort((a: IResourceItemBase, b: IResourceItemBase) => (b.priority ?? -99) - (a.priority ?? -99));
    // Use set timeout to ensure title changes after other default title change
  }

  public goToCollection() {
    // Route from one collection to another
    if (this.route.snapshot.paramMap.get('collectionId')) {
      this.router.navigate([this.collection._key], {
        relativeTo: this.route,
      });
    }
    // Route from base to collection
    else {
      this.router.navigate(['collection', this.collection._key], {
        relativeTo: this.route,
      });
    }
  }
}

export class CollectionItemHandler {
  resource: IResourceCollection;
  constructor(private component: ResourceItemComponent) {
    this.resource = component.resource as IResourceCollection;
    this.handleOverrides();
  }

  private async handleOverrides() {
    const { translateService } = this.component;
    const resource = this.resource as IResourceCollection;
    const suffix = await translateService.translateText('Resources');
    this.component.subtitle = `${resource.childResources.length} ${suffix}`;
  }
}
