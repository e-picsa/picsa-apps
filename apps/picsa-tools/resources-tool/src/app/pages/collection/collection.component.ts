import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { Subject, takeUntil } from 'rxjs';
import { IResource, IResourceCollection } from '../../models';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'picsa-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit, OnDestroy {
  title = 'Collection';
  collection: IResourceCollection | undefined;
  collectionResources: IResource[] = [];
  componentDestroyed$ = new Subject();
  constructor(
    private store: ResourcesStore,
    private route: ActivatedRoute,
    private componentsService: PicsaCommonComponentsService
  ) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((params) => {
        console.log('params', params);
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
      this.componentsService.setHeader({ title: foundCollection.title });
      this.collectionResources = this.collection.childResources.map(
        (resourceId) => this.store.getResourceById(resourceId)
      );
    }
  }
}
