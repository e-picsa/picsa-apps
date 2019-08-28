import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IResource } from '../../models/models';

@Component({
  selector: 'resource-item',
  templateUrl: './resource-item.html',
  styleUrls: ['./resource-item.scss']
})
export class ResourceItemComponent {
  @Input() resource: IResource;
  @Output() onResourceClick = new EventEmitter<IResource>();

  resourceClick() {
    console.log('resource clicked');
    this.onResourceClick.emit(this.resource);
  }
}
