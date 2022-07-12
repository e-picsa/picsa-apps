import { Component, Input, OnInit } from '@angular/core';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { IResource, IResourceGroup } from '../../models';

@Component({
  selector: 'picsa-resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent implements OnInit {
  @Input() resource: IResource;
  subtitle = '';

  // isDownloading = false;
  // progress = 0;
  constructor(private translateService: PicsaTranslateService) {}

  ngOnInit() {
    if (this.resource.type === 'group') {
      this.handleGroupResource(this.resource as IResourceGroup);
    }
  }

  private async handleGroupResource(resource: IResourceGroup) {
    const suffix = await this.translateService.translateText('Resources');
    this.subtitle = `${resource.resources.length} ${suffix}`;
  }

  handleResourceClick() {
    console.log('handle resource click', this.resource);
    //   this.store.openResource(this.resource);
    // } else {
    //   this.isDownloading = true;
    //   this.store.downloadResource(this.resource).subscribe(
    //     (progress) => {
    //       console.log('progress', progress);
    //       this.progress = progress;
    //     },
    //     (err) => {
    //       this.isDownloading = false;
    //       throw err;
    //     },
    //     () => (this.isDownloading = false)
    //   );
    // }
  }
}
