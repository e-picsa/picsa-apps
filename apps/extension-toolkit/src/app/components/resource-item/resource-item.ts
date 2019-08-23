import { Component, Input } from '@angular/core';
import { IResource } from '../../models/models';

@Component({
  selector: 'resource-item',
  templateUrl: './resource-item.html',
  styleUrls: ['./resource-item.scss']
})
export class ResourceItemComponent {
  @Input() resource: IResource;
}
