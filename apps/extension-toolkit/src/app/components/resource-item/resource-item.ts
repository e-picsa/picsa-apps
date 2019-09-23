import { Component, Input } from '@angular/core';
import { IResource } from '../../models/models';
import { ResourcesStore } from '../../store/resources.store';

@Component({
  selector: 'resource-item',
  templateUrl: './resource-item.html',
  styleUrls: ['./resource-item.scss']
})
export class ResourceItemComponent {
  @Input() resource: IResource;
  isDownloading = false;
  progress: number = 0;
  constructor(private store: ResourcesStore) {}

  resourceClick() {
    if (this.resource._isDownloaded) {
      this.store.openResource(this.resource);
    } else {
      this.isDownloading = true;
      this.store.downloadResource(this.resource).subscribe(
        progress => {
          console.log('progress', progress);
          this.progress = progress;
        },
        err => {
          this.isDownloading = false;
          throw err;
        },
        () => (this.isDownloading = false)
      );
    }
  }
}
