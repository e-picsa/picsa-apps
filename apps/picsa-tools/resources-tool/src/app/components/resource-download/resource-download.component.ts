import { Component, Input } from '@angular/core';

import { IResourceFile } from '../../schemas';

@Component({
  selector: 'resource-download',
  templateUrl: './resource-download.component.html',
  styleUrls: ['./resource-download.component.scss'],
})
export class ResourceDownloadComponent {
  @Input() resource: IResourceFile;

  downloadResource() {
    console.log('downloading resource', this.resource);
  }
}
