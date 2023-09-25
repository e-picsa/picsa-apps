import { Component, Input } from '@angular/core';

import { IResourceFile } from '../../../models';

@Component({
  selector: 'resource-item-pdf',
  template: `name.component.html`,
})
export class ResourceItemPDFComponent {
  @Input() resource: IResourceFile;
}
