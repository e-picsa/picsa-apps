import { Component, Input, OnInit } from '@angular/core';
import { ResourcesToolService } from '@picsa/resources/src/app/services/resources-tool.service';
import { RxDocument } from 'rxdb';

import { IResourceFile, IResourceLink } from '../../../../schemas';

@Component({
  selector: 'resource-item-file',
  templateUrl: 'file.html',
  styleUrls: ['file.scss'],
})
export class ResourceItemFileComponent implements OnInit {
  @Input() resource: IResourceFile;

  public showDownloadOverlay = true;

  public dbDoc: RxDocument<IResourceFile>;

  constructor(private service: ResourcesToolService) {}

  async ngOnInit() {
    const dbDoc = await this.service.dbFiles.findOne(this.resource.id).exec();
    if (dbDoc) {
      this.dbDoc = dbDoc;
    }
  }

  public handleResourceDownloaded(e) {
    console.log('resource downloaded', e);
  }

  /** Display file in resource link format */
  public get resourceLink() {
    const link: IResourceLink = {
      ...this.resource,
      subtype: 'internal',
      type: 'link',
    };
    return link;
  }

  public handleClick(e: Event) {
    // TODO - should be openResource method assuming child will be blocked by overlay if not downloaded
    console.log('file clicked', this.resource);
  }
}
