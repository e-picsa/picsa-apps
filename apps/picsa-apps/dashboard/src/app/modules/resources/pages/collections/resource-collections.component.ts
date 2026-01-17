import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject,OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow } from '../../types';

interface IMergedCollection extends Omit<IResourceCollectionRow, 'collection_parent'> {
  collection_parent?: IResourceCollectionRow;
}

const DISPLAY_COLUMNS: (keyof IMergedCollection)[] = [
  'cover_image',
  'title',
  'description',
  // 'resource_collections',
  // 'resource_files',
  // 'resource_links',
  'collection_parent',
  // 'sort_order',
  'modified_at',
];

@Component({
  selector: 'dashboard-resource-collections',
  imports: [
    CommonModule,
    CommonModule,
    DashboardMaterialModule,
    PicsaDataTableComponent,
    RouterModule,
    StoragePathPipe,
  ],
  templateUrl: './resource-collections.component.html',
  styleUrl: './resource-collections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCollectionsComponent implements OnInit {
  private service = inject(ResourcesDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public collections: IMergedCollection[] = [];
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: (collection: IMergedCollection, e) => {
      e.stopImmediatePropagation();
      this.router.navigate([collection.id], { relativeTo: this.route });
    },
    formatHeader: (v) => {
      switch (v as keyof IMergedCollection) {
        case 'resource_collections':
          return 'Child Collections';
        case 'resource_files':
          return 'Files';
        case 'resource_links':
          return 'Links';
        case 'collection_parent':
          return 'Parent Collection';
        default:
          return formatHeaderDefault(v);
      }
    },
  };

  constructor() {
    const service = this.service;

    effect(() => {
      const collectionsHashmap = this.service.collectionsById();
      const collections = service.collections().map((c) => this.mergeCollectionData(c, collectionsHashmap));
      this.collections = collections.sort(this.sortCollections);
    });
  }
  async ngOnInit() {
    await this.service.ready();
  }

  private mergeCollectionData(
    collection: IResourceCollectionRow,
    collectionsHashmap: Record<string, IResourceCollectionRow>,
  ): IMergedCollection {
    return {
      ...collection,
      collection_parent: collectionsHashmap[collection.collection_parent || ''],
    };
  }

  /** Sort collections first by name of parent (root collections first), then by modified date   */
  private sortCollections(a: IMergedCollection, b: IMergedCollection) {
    if (a.collection_parent === b.collection_parent) {
      return b.modified_at > a.modified_at ? 1 : -1;
    }
    return (b.collection_parent || '') > (a.collection_parent || '') ? -1 : 1;
  }

  private getCollectionTree(collections: IResourceCollectionRow[]) {
    const nodes = {};

    const children = {};
    for (const { collection_parent } of collections) {
      if (collection_parent) {
        if (!children[collection_parent]) children[collection_parent] = [];
        children[collection_parent].push(collections);
      }
    }
  }
}
