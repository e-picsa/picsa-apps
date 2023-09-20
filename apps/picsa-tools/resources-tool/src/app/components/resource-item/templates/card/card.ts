import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IResource } from '../../../../models';

@Component({
  selector: 'resource-item-card',
  templateUrl: 'card.html',
  styleUrls: ['card.scss'],
})
export class ResourceItemCardComponent {
  @Output() handleClick = new EventEmitter();
  @Input() resource: IResource;
}
