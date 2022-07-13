import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IResourceCollection } from '../../models';
import { ResourcesStore } from '../../stores';

@Component({
  selector: 'picsa-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
})
export class CollectionComponent implements OnInit, OnDestroy {
  title = 'Collection';
  collection: IResourceCollection | undefined;
  componentDestroyed$ = new Subject();
  constructor(private store: ResourcesStore, private route: ActivatedRoute) {}

  ngOnDestroy() {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((params) => {
        console.log('params', params);
        const { collectionId, subcollectionId } = params;
        if (collectionId) {
          this.loadCollection(collectionId, subcollectionId);
        } else {
          this.collection = undefined;
        }
      });
  }

  private async loadCollection(id: string, subcollectionId?: string) {
    const foundCollection = this.store.getCollectionById(id, subcollectionId);
    if (foundCollection) {
      this.collection = foundCollection as IResourceCollection;
      this.title = this.collection.title;
    }
  }
}
