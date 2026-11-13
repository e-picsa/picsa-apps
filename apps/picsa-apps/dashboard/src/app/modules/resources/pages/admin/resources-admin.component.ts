import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { IResourceCountryBundle, RESOURCE_BUNDLES } from '@picsa/resources/data/bundles';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceFileRow, IResourceLinkRow } from '../../types';

export type ResourceSyncStatus = 'In Sync' | 'Differs' | 'Missing in App' | 'Orphaned in App';
export type ResourceKind = 'Collection' | 'File' | 'Link';
export type ResourceStatusFilter = 'all' | ResourceSyncStatus;

export interface IResourceDiffRow {
  id: string;
  kind: ResourceKind;
  title: string;
  status: ResourceSyncStatus;
  dbItem?: IResourceCollectionRow | IResourceFileRow | IResourceLinkRow;
  appItem?: unknown;
}

export interface IResourceSyncStats {
  total: number;
  inSync: number;
  differs: number;
  missingInApp: number;
  orphanedInApp: number;
}

const DISPLAY_COLUMNS: (keyof IResourceDiffRow)[] = ['kind', 'title', 'status'];

@Component({
  selector: 'dashboard-resources-admin',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    MatIconModule,
    MatTooltipModule,
    PicsaDataTableComponent,
    RouterModule,
  ],
  templateUrl: './resources-admin.component.html',
  styleUrl: './resources-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesAdminComponent implements OnInit {
  private readonly service = inject(ResourcesDashboardService);
  private readonly deploymentService = inject(DeploymentDashboardService);

  public activeCountry = computed(() => {
    return this.deploymentService.activeDeploymentCountry() || '';
  });

  public activeCountryLabel = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    return deployment?.label || this.activeCountry().toUpperCase();
  });

  /** Filter by status: 'all' | ResourceSyncStatus */
  public selectedStatus = signal<ResourceStatusFilter>('all');

  /** Active country bundle statically imported from the app data bundle */
  public appBundle = computed<IResourceCountryBundle | null>(() => {
    const code = this.activeCountry().toLowerCase();
    return RESOURCE_BUNDLES[code] || null;
  });

  /** All calculated diff rows across collections, files, and links */
  public allDiffRows = computed<IResourceDiffRow[]>(() => {
    const bundle = this.appBundle() || { collections: [], files: [], links: [] };

    return [
      ...this.computeCollectionDiffs(this.service.collections(), bundle.collections || []),
      ...this.computeFileDiffs(this.service.files(), bundle.files || []),
      ...this.computeLinkDiffs(this.service.links(), bundle.links || []),
    ];
  });

  /** Summary counters across all resource diff rows */
  public stats = computed<IResourceSyncStats>(() => {
    const rows = this.allDiffRows();
    let inSync = 0;
    let differs = 0;
    let missingInApp = 0;
    let orphanedInApp = 0;

    for (const row of rows) {
      switch (row.status) {
        case 'In Sync':
          inSync++;
          break;
        case 'Differs':
          differs++;
          break;
        case 'Missing in App':
          missingInApp++;
          break;
        case 'Orphaned in App':
          orphanedInApp++;
          break;
      }
    }

    return {
      total: rows.length,
      inSync,
      differs,
      missingInApp,
      orphanedInApp,
    };
  });

  /** Filtered rows based on selected summary status chip */
  public displayedRows = computed<IResourceDiffRow[]>(() => {
    const status = this.selectedStatus();
    const rows = this.allDiffRows();
    if (status === 'all') return rows;
    return rows.filter((row) => row.status === status);
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS as string[],
    filterColumns: ['kind'],
    formatHeader: (v) => {
      switch (v) {
        case 'kind':
          return 'Type';
        case 'title':
          return 'Resource / Collection';
        case 'status':
          return 'Sync Status';
        default:
          return formatHeaderDefault(v);
      }
    },
  };

  async ngOnInit() {
    await this.service.ready();
  }

  public toggleStatusFilter(status: ResourceSyncStatus): void {
    this.selectedStatus.set(this.selectedStatus() === status ? 'all' : status);
  }

  private computeEntityDiffs<
    TDb extends IResourceCollectionRow | IResourceFileRow | IResourceLinkRow,
    TApp extends { id: string },
  >(
    kind: ResourceKind,
    dbList: TDb[],
    appList: TApp[],
    options: {
      getTitle: (item: TDb | TApp) => string;
      hasDiff: (dbItem: TDb, appItem: TApp) => boolean;
    },
  ): IResourceDiffRow[] {
    const rows: IResourceDiffRow[] = [];
    const appMap = new Map(appList.map((item) => [item.id, item]));
    const dbMap = new Map(dbList.map((item) => [item.id, item]));

    for (const dbItem of dbList) {
      const appItem = appMap.get(dbItem.id);
      if (!appItem) {
        rows.push({
          id: dbItem.id,
          kind,
          title: options.getTitle(dbItem),
          status: 'Missing in App',
          dbItem,
        });
        continue;
      }

      rows.push({
        id: dbItem.id,
        kind,
        title: options.getTitle(dbItem),
        status: options.hasDiff(dbItem, appItem) ? 'Differs' : 'In Sync',
        dbItem,
        appItem,
      });
    }

    for (const appItem of appList) {
      if (!dbMap.has(appItem.id)) {
        rows.push({
          id: appItem.id,
          kind,
          title: options.getTitle(appItem),
          status: 'Orphaned in App',
          appItem,
        });
      }
    }

    return rows;
  }

  private hasSameIds(a?: string[] | null, b?: string[] | null): boolean {
    const listA = a || [];
    const listB = b || [];
    if (listA.length !== listB.length) return false;
    const setB = new Set(listB);
    return listA.every((id) => setB.has(id));
  }

  /**
   * Compare a Supabase storage `cover_image` path against an exported app bundle path.
   * App bundle exports (`sync-resources`) move covers into `assets/resources/covers/`
   * (flattening `global/`) and convert raster images to `.webp`.
   */
  private isSameCoverImage(dbCover?: string | null, appCover?: string | null): boolean {
    const toCoverKey = (value?: string | null) => {
      const path = (value || '').trim();
      if (!path || path.startsWith('http://') || path.startsWith('https://')) return path;
      return path
        .replace(/^(?:assets|global)\/resources\/covers\//, '')
        .replace(/^([a-z]{2})\/resources\/covers\//, '$1/')
        .replace(/\.(png|jpe?g|webp)$/i, '.webp');
    };
    return toCoverKey(dbCover) === toCoverKey(appCover);
  }

  private computeCollectionDiffs(
    dbList: IResourceCollectionRow[],
    appList: IResourceCountryBundle['collections'],
  ): IResourceDiffRow[] {
    return this.computeEntityDiffs('Collection', dbList, appList, {
      getTitle: (c) => c.title || c.id,
      hasDiff: (dbItem, appItem) =>
        dbItem.title !== appItem.title ||
        (dbItem.description || null) !== (appItem.description || null) ||
        !this.isSameCoverImage(dbItem.cover_image, appItem.cover_image) ||
        (dbItem.sort_order ?? 1) !== (appItem.sort_order ?? 1) ||
        !this.hasSameIds(dbItem.resource_files, appItem.resource_files) ||
        !this.hasSameIds(dbItem.resource_links, appItem.resource_links),
    });
  }

  private computeFileDiffs(dbList: IResourceFileRow[], appList: IResourceCountryBundle['files']): IResourceDiffRow[] {
    return this.computeEntityDiffs('File', dbList, appList, {
      getTitle: (f) => f.title || f.filename || f.id,
      hasDiff: (dbItem, appItem) =>
        dbItem.title !== appItem.title ||
        (dbItem.storage_file || null) !== (appItem.storage_file || null) ||
        !this.isSameCoverImage(dbItem.cover_image, appItem.cover_image) ||
        (dbItem.language_code || null) !== (appItem.language_code || null) ||
        (dbItem.external_url || null) !== (appItem.external_url || null),
    });
  }

  private computeLinkDiffs(dbList: IResourceLinkRow[], appList: IResourceCountryBundle['links']): IResourceDiffRow[] {
    return this.computeEntityDiffs('Link', dbList, appList, {
      getTitle: (l) => l.title || l.id,
      hasDiff: (dbItem, appItem) =>
        dbItem.title !== appItem.title ||
        dbItem.url !== appItem.url ||
        dbItem.type !== appItem.type ||
        !this.isSameCoverImage(dbItem.cover_image, appItem.cover_image),
    });
  }
}
