import { Component, Input, OnInit } from '@angular/core';

import { IResourceCollection, IResourceLink } from '../../../schemas';
import { ResourceItemLinkComponent } from '../link/link';

@Component({
  selector: 'resource-item-collection',
  templateUrl: 'collection.html',
  styleUrls: ['collection.scss'],
  imports: [ResourceItemLinkComponent],
})
export class ResourceItemCollectionComponent implements OnInit {
  // Collections are simply rendered as a link to the collection
  public collectionLink: IResourceLink;

  @Input() collection: IResourceCollection;

  ngOnInit() {
    this.collectionLink = {
      ...this.collection,
      subtype: 'internal',
      url: `/resources/collection/${this.collection.id}`,
      type: 'link',
    };
  }
}
