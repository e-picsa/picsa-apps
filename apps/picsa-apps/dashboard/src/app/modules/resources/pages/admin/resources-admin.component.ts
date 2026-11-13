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
import { normalizeBundledCoverPath } from '../../utils';

export type ResourceSyncStatus = 'In Sync' | 'Differs' | 'Missing in App' | 'Orphaned in App';
export type ResourceKind = 'Collection' | 'File' | 'Link';
export type ResourceStatusFilter = 'all' | ResourceSyncStatus;

export interface IResourceDiffRow {
  id: string;
  kind: ResourceKind;
  title: string;
  status: ResourceSyncStatus;
  detail: string;
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

const DISPLAY_COLUMNS: (keyof IResourceDiffRow)[] = ['kind', 'title', 'status', 'detail'];

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
  private service = inject(ResourcesDashboardService);
  private deploymentService = inject(DeploymentDashboardService);

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
        case 'detail':
          return 'Sync Details';
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
      getDiffs: (dbItem: TDb, appItem: TApp) => string[];
      getInSyncDetail: (dbItem: TDb) => string;
      missingDetail: string;
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
          detail: options.missingDetail,
          dbItem,
        });
        continue;
      }

      const diffs = options.getDiffs(dbItem, appItem);
      rows.push({
        id: dbItem.id,
        kind,
        title: options.getTitle(dbItem),
        status: diffs.length > 0 ? 'Differs' : 'In Sync',
        detail: diffs.length > 0 ? diffs.join(', ') : options.getInSyncDetail(dbItem),
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
          detail: 'Present in app bundle, but deleted from data-system',
          appItem,
        });
      }
    }

    return rows;
  }

  private computeCollectionDiffs(
    dbList: IResourceCollectionRow[],
    appList: IResourceCountryBundle['collections'],
  ): IResourceDiffRow[] {
    return this.computeEntityDiffs('Collection', dbList, appList, {
      getTitle: (c) => c.title || c.id,
      missingDetail: 'Created in data-system, not yet synced to app bundle',
      getInSyncDetail: (c) => `${(c.resource_files || []).length} files, ${(c.resource_links || []).length} links`,
      getDiffs: (dbItem, appItem) => {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push(`Title ('${dbItem.title}' vs app '${appItem.title}')`);
        if ((dbItem.description || null) !== (appItem.description || null)) diffs.push('Description changed');
        if (normalizeBundledCoverPath(dbItem.cover_image) !== normalizeBundledCoverPath(appItem.cover_image)) {
          diffs.push('Cover image changed');
        }
        if ((dbItem.sort_order ?? 1) !== (appItem.sort_order ?? 1)) {
          diffs.push(`Sort order (${dbItem.sort_order ?? 1} vs app ${appItem.sort_order ?? 1})`);
        }

        const dbFiles = [...(dbItem.resource_files || [])].sort((a, b) => a.localeCompare(b));
        const appFiles = [...(appItem.resource_files || [])].sort((a, b) => a.localeCompare(b));
        if (JSON.stringify(dbFiles) !== JSON.stringify(appFiles)) {
          diffs.push(`Files (${dbFiles.length} vs app ${appFiles.length})`);
        }

        const dbLinks = [...(dbItem.resource_links || [])].sort((a, b) => a.localeCompare(b));
        const appLinks = [...(appItem.resource_links || [])].sort((a, b) => a.localeCompare(b));
        if (JSON.stringify(dbLinks) !== JSON.stringify(appLinks)) {
          diffs.push(`Links (${dbLinks.length} vs app ${appLinks.length})`);
        }

        return diffs;
      },
    });
  }

  private computeFileDiffs(dbList: IResourceFileRow[], appList: IResourceCountryBundle['files']): IResourceDiffRow[] {
    return this.computeEntityDiffs('File', dbList, appList, {
      getTitle: (f) => f.title || f.filename || f.id,
      missingDetail: 'Uploaded in data-system, not yet synced to app bundle',
      getInSyncDetail: (f) => `${f.mimetype || 'file'} • ${f.size_kb ?? 0} KB`,
      getDiffs: (dbItem, appItem) => {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push('Title changed');
        if ((dbItem.storage_file || null) !== (appItem.storage_file || null)) diffs.push('Storage file changed');
        if (normalizeBundledCoverPath(dbItem.cover_image) !== normalizeBundledCoverPath(appItem.cover_image)) {
          diffs.push('Cover image changed');
        }
        if ((dbItem.language_code || null) !== (appItem.language_code || null)) diffs.push('Language changed');
        if ((dbItem.external_url || null) !== (appItem.external_url || null)) diffs.push('URL changed');
        return diffs;
      },
    });
  }

  private computeLinkDiffs(dbList: IResourceLinkRow[], appList: IResourceCountryBundle['links']): IResourceDiffRow[] {
    return this.computeEntityDiffs('Link', dbList, appList, {
      getTitle: (l) => l.title || l.id,
      missingDetail: 'Created in data-system, not yet synced to app bundle',
      getInSyncDetail: (l) => l.url || '',
      getDiffs: (dbItem, appItem) => {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push('Title changed');
        if (dbItem.url !== appItem.url) diffs.push('URL changed');
        if (dbItem.type !== appItem.type) diffs.push(`Type (${dbItem.type} vs ${appItem.type})`);
        if (normalizeBundledCoverPath(dbItem.cover_image) !== normalizeBundledCoverPath(appItem.cover_image)) {
          diffs.push('Cover changed');
        }
        return diffs;
      },
    });
  }
}
