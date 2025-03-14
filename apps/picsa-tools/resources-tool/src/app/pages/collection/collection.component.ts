import { Component, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { ResourceCollectionComponent } from '@picsa/resources/components';
import { IResourceCollection } from '@picsa/resources/schemas';
import { map } from 'rxjs';

interface ICollectionPageRouteParams {
  collectionId: string;
}

@Component({
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
  standalone: true,
  imports: [ResourceCollectionComponent],
})
export class CollectionComponent implements OnInit, OnDestroy {
  public collectionId = toSignal(this.route.params.pipe(map((v) => (v as ICollectionPageRouteParams).collectionId)));

  constructor(private route: ActivatedRoute, private componentsService: PicsaCommonComponentsService) {}

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
