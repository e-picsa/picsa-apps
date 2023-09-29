import { Component, Input } from '@angular/core';

import { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { IResourceBase } from '../../schemas/base';

@Component({
  selector: 'resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent {
  @Input() resource: IResourceBase;

  public get resourceFile() {
    return this.resource as IResourceFile;
  }
  public get resourceCollection() {
    return this.resource as IResourceCollection;
  }
  public get resourceLink() {
    return this.resource as IResourceLink;
  }
}
