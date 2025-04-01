import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ResourceItemCollectionComponent } from '@picsa/resources/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { IResourceCollection } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [PicsaTranslateModule, MatIconModule, ResourceItemCollectionComponent],
})
export class HomeComponent implements OnInit {
  public collections: IResourceCollection[];

  constructor(public service: ResourcesToolService) {}

  async ngOnInit() {
    await this.service.ready();
    const collections = await this.service.dbCollections.find({ sort: [{ priority: 'desc' }] }).exec();
    const localised = this.service.filterLocalisedResources(collections);
    this.collections = localised.filter((c) => !c._data.parentCollection).map((c) => c._data);
  }
}
