import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow } from '../../types';

const DISPLAY_COLUMNS: (keyof IResourceCollectionRow)[] = [
  'cover_image',
  'title',
  'description',
  'resource_collections',
  'resource_files',
  'resource_links',
  'collection_parent',
  'sort_order',
  'modified_at',
];

@Component({
  selector: 'dashboard-resource-collections',
  standalone: true,
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
})
export class ResourceCollectionsComponent implements OnInit {
  public collections: IResourceCollectionRow[] = [];
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    formatHeader: (v) => {
      switch (v as keyof IResourceCollectionRow) {
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

  constructor(private service: ResourcesDashboardService) {
    effect(() => {
      const collections = service.collections();
      this.collections = collections.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
    });
  }
  async ngOnInit() {
    await this.service.ready();
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
