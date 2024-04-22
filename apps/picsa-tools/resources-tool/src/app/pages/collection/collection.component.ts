import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { RxDocument } from 'rxdb';
import { Subject, takeUntil } from 'rxjs';

import { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit, OnDestroy {
  public collection: IResourceCollection | undefined;
  public files: IResourceFile[] = [];
  public links: IResourceLink[] = [];
  public collections: IResourceCollection[] = [];

  public showcollectionNotFound = false;

  private componentDestroyed$ = new Subject();

  @Input() styleVariant: 'primary' | 'white' = 'primary';

  @Input() size = 48;

  @Input() hideOnComplete = false;

  constructor(
    private service: ResourcesToolService,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService
  ) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
    this.componentsService.updateBreadcrumbOptions({ enabled: false });
  }

  async ngOnInit() {
    this.componentsService.updateBreadcrumbOptions({
      enabled: true,
      hideOnPaths: {
        '/collection': true,
        '/resources/collection': true,
      },
    });
    await this.service.ready();
    this.route.params.pipe(takeUntil(this.componentDestroyed$)).subscribe((params) => {
      const { collectionId } = params;
      if (collectionId) {
        this.loadCollection(collectionId);
      } else {
        this.collection = undefined;
      }
    });
  }

  private async loadCollection(id: string) {
    const foundCollection = await this.service.dbCollections.findOne(id).exec();
    this.showcollectionNotFound = foundCollection ? false : true;
    if (foundCollection) {
      this.collection = foundCollection._data;
      await this.loadCollectionResources(foundCollection._data);
      setTimeout(() => {
        this.componentsService.setHeader({ title: foundCollection.title });
      }, 0);
    }
  }

  private async loadCollectionResources(collection: IResourceCollection) {
    const { collections, files, links } = collection.childResources;
    const linkDocs = await this.service.dbLinks.findByIds(links).sort('priority').exec();
    this.links = this.processDocs(linkDocs);
    const collectionDocs = await this.service.dbCollections.findByIds(collections).sort('priority').exec();
    this.collections = this.processDocs(collectionDocs);
    const fileDocs = await this.service.dbFiles.findByIds(files).sort('priority').exec();
    this.files = this.processDocs(fileDocs);
  }
  private processDocs(docs: Map<string, RxDocument<any>>) {
    const entries = [...docs.values()];
    return this.service.filterLocalisedResources(entries).map((d) => d._data);
  }
}
