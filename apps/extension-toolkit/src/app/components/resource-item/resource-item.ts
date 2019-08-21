import { Component, Input } from '@angular/core';
import { IResource } from '../../models/models';

@Component({
  selector: 'resource-item',
  templateUrl: 'resource-item',
  styleUrls: ['./resource-item']
})
export class ResourceItemComponent {
  @Input() resource: IResource;
}
