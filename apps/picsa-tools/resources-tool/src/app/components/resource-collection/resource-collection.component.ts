import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AlertBoxComponent } from '@picsa/components/alert-box/alert-box.component';
import { PicsaTranslateModule } from '@picsa/i18n';
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
  private service = inject(ResourcesToolService);

  /** Resource collection id to load */
  public id = input.required<string>();

  /** Output emitter to notify collection loaded */
  public collectionLoaded = output<IResourceCollection>();

  /** Loaded collection */
  public collection = signal<IResourceCollection | undefined>(undefined);

  public showcollectionNotFound = signal(false);

  public files = signal<IResourceFile[]>([]);
  public pendingDownloads = signal<RxDocument<IResourceFile>[]>([]);
  public links = signal<IResourceLink[]>([]);
  public collections = signal<IResourceCollection[]>([]);

  constructor() {
    effect(() => {
      const id = this.id();
      this.loadCollection(id);
    });
  }

  private async loadCollection(id: string) {
    const foundCollection = this.service.getCollection(id);

    this.showcollectionNotFound.set(!foundCollection);
    if (foundCollection) {
      this.collection.set(foundCollection);
      this.collectionLoaded.emit(foundCollection);
      await this.loadCollectionResources(foundCollection);
    } else {
      console.warn('Collection not found', id);
    }
  }

  private async loadCollectionResources(collection: IResourceCollection) {
    const { collections, files, links } = collection.childResources;
    this.links.set(this.service.getLinks(links));
    this.collections.set(this.service.getCollections(collections));

    // Files are retrieved from manifest and cross-referenced with dbFiles for offline attachments
    const fileEntries = this.service.getFiles(files);
    this.files.set(fileEntries);

    await this.service.ready();
    const fileDocs = await this.service.dbFiles.findByIds(files).exec();
    const pending: RxDocument<IResourceFile>[] = [];
    for (const f of fileEntries) {
      const doc = fileDocs.get(f.id);
      if (doc && doc.allAttachments().length === 0) {
        pending.push(doc);
      }
    }
    this.pendingDownloads.set(pending);
  }
}
