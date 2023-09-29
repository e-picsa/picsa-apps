import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { Subject, takeUntil } from 'rxjs';

import { IResourceCollection } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'resource-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit, OnDestroy {
  public collection: IResourceCollection | undefined;
  public showcollectionNotFound = false;

  private componentDestroyed$ = new Subject();

  constructor(
    private service: ResourcesToolService,
    private store: ResourcesStore,
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

    // TODO - replace with service methods

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
    const foundCollection = this.store.getResourceById<IResourceCollection>(id);
    this.showcollectionNotFound = foundCollection ? false : true;
    if (foundCollection) {
      this.collection = foundCollection;
      setTimeout(() => {
        this.componentsService.setHeader({ title: foundCollection.title });
      }, 0);
    }
  }
}
