import { Component, inject,OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ResourceItemCollectionComponent } from '../../components';
import { IResourceCollection } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [PicsaTranslateModule, MatButtonModule, MatIconModule, ResourceItemCollectionComponent, RouterLink],
})
export class HomeComponent implements OnInit {
  service = inject(ResourcesToolService);

  public collections: IResourceCollection[];

  async ngOnInit() {
    await this.service.ready();
    const collections = await this.service.dbCollections.find({ sort: [{ priority: 'desc' }] }).exec();
    const localised = this.service.filterLocalisedResources(collections);
    this.collections = localised.filter((c) => !c._data.parentCollection).map((c) => c._data);
  }
}
