import { Component, inject,OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { map } from 'rxjs';

import { ResourceCollectionComponent } from '../../components';
import type { IResourceCollection } from '../../schemas';

interface ICollectionPageRouteParams {
  collectionId: string;
}

@Component({
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
  imports: [ResourceCollectionComponent, RouterModule],
})
export class CollectionComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private componentsService = inject(PicsaCommonComponentsService);

  public collectionId = toSignal(this.route.params.pipe(map((v) => (v as ICollectionPageRouteParams).collectionId)));

  ngOnDestroy() {
    this.componentsService.updateBreadcrumbOptions({ enabled: false });
  }

  ngOnInit() {
    this.componentsService.updateBreadcrumbOptions({
      enabled: true,
      hideOnPaths: {
        '/collection': true,
        '/resources/collection': true,
      },
    });
  }

  public handleCollectionLoaded(collection: IResourceCollection) {
    setTimeout(() => {
      this.componentsService.setHeader({ title: collection.title });
    }, 0);
  }
}
