/* eslint-disable @nx/enforce-module-boundaries */

import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AlertBoxComponent } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { RxDocument } from 'rxdb';

import type { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';
import { ResourceDownloadMultipleComponent } from '../resource-download-multiple/resource-download-multiple.component';
import {
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
} from '../resource-item';

@Component({
  selector: 'resource-collection',
  imports: [
    AlertBoxComponent,
    MatCardModule,
    PicsaTranslateModule,
    ResourceDownloadMultipleComponent,
    ResourceItemCollectionComponent,
    ResourceItemLinkComponent,
    ResourceItemFileComponent,
  ],
  templateUrl: './resource-collection.component.html',
  styleUrl: './resource-collection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCollectionComponent {
  /** Resource collection id to load */
  public id = input.required<string>();

  /** Output emitter to notify colleciton loaded */
  public collectionLoaded = output<IResourceCollection>();

  /** Loaded collection */
  public collection = signal<any>(undefined);

  public showcollectionNotFound = signal(false);

  public files = signal<IResourceFile[]>([]);
  public pendingDownloads = signal<RxDocument<IResourceFile>[]>([]);
  public links = signal<IResourceLink[]>([]);
  public collections = signal<IResourceCollection[]>([]);

  constructor(private service: ResourcesToolService) {
    effect(() => {
      const id = this.id();
      this.loadCollection(id);
    });
  }

  private async loadCollection(id: string) {
    await this.service.ready();
    const foundCollection = await this.service.dbCollections.findOne(id).exec();

    this.showcollectionNotFound.set(foundCollection ? false : true);
    if (foundCollection) {
      this.collection.set(foundCollection._data);
      this.collectionLoaded.emit(foundCollection._data);
      await this.loadCollectionResources(foundCollection._data);
    } else {
      console.warn('Collection not found', id);
    }
  }

  private async loadCollectionResources(collection: IResourceCollection) {
    const { collections, files, links } = collection.childResources;
    const linkDocs = await this.service.dbLinks.findByIds(links).sort('priority').exec();
    this.links.set(this.processDocs(linkDocs));
    const collectionDocs = await this.service.dbCollections.findByIds(collections).sort('priority').exec();
    this.collections.set(this.processDocs(collectionDocs));
    // manually process fileDocs to also allow storing to fileDocs signal
    const fileDocs = await this.service.dbFiles.findByIds(files).sort('priority').exec();
    const filtered = this.service.filterLocalisedResources([...fileDocs.values()]);
    this.pendingDownloads.set(filtered.filter((f) => f.allAttachments().length === 0));
    this.files.set(filtered.map((d) => d._data));
  }
  private processDocs(docs: Map<string, RxDocument<any>>) {
    const entries = [...docs.values()];
    return this.service.filterLocalisedResources(entries).map((d) => d._data);
  }
}
