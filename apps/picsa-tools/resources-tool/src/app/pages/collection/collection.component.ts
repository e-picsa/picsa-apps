import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { Subject, takeUntil } from 'rxjs';

import { IResourceCollection } from '../../models';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'resource-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit, OnDestroy {
  title = 'Collection';
  collection: IResourceCollection | undefined;
  componentDestroyed$ = new Subject();
  constructor(
    private store: ResourcesStore,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService
  ) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
    this.componentsService.updateBreadcrumbOptions({ enabled: false });
  }

  ngOnInit(): void {
    this.componentsService.updateBreadcrumbOptions({
      enabled: true,
      hideOnPaths: {
        '/collection': true,
        '/resources/collection': true,
      },
    });
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
    if (foundCollection) {
      this.collection = foundCollection;

      setTimeout(() => {
        this.componentsService.setHeader({ title: foundCollection.title });
      }, 0);
    }
  }
}
