import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IResourceCollection, IResourceLink } from '../../../schemas';
import { ResourceItemLinkComponent } from '../link/link';

@Component({
  selector: 'resource-item-collection',
  templateUrl: 'collection.html',
  styleUrls: ['collection.scss'],
  imports: [ResourceItemLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceItemCollectionComponent {
  // Collections are simply rendered as a link to the collection
  readonly collection = input.required<IResourceCollection>();

  readonly collectionLink = computed<IResourceLink>(() => ({
    ...this.collection(),
    subtype: 'internal',
    url: `/resources/collection/${this.collection().id}`,
    type: 'link',
  }));
}
