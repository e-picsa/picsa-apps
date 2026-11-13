import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
    FormsModule,
    MatButtonToggleModule,
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

  /** Filter by resource kind: 'all' | 'Collection' | 'File' | 'Link' */
  public selectedKind = signal<string>('all');

  /** Filter by status: 'all' | 'actionable' | 'In Sync' | 'Differs' | 'Missing in App' | 'Orphaned in App' */
  public selectedStatus = signal<string>('all');

  /** Text search query */
  public searchTerm = signal<string>('');

  /** Active country bundle statically imported from the app data bundle */
  public appBundle = computed<IResourceCountryBundle | null>(() => {
    const code = this.activeCountry().toLowerCase();
    return RESOURCE_BUNDLES[code] || null;
  });

  /** All calculated diff rows across collections, files, and links */
  public allDiffRows = computed<IResourceDiffRow[]>(() => {
    const bundle = this.appBundle() || { collections: [], files: [], links: [] };
    const dbCollections = this.service.collections();
    const dbFiles = this.service.files();
    const dbLinks = this.service.links();

    const collectionRows = this.computeCollectionDiffs(dbCollections, bundle.collections || []);
    const fileRows = this.computeFileDiffs(dbFiles, bundle.files || []);
    const linkRows = this.computeLinkDiffs(dbLinks, bundle.links || []);

    return [...collectionRows, ...fileRows, ...linkRows];
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

  /** Filtered rows based on kind, status, and search query */
  public displayedRows = computed<IResourceDiffRow[]>(() => {
    const kind = this.selectedKind();
    const status = this.selectedStatus();
    const search = this.searchTerm().toLowerCase().trim();

    return this.allDiffRows().filter((row) => {
      if (kind !== 'all' && row.kind !== kind) return false;
      if (status === 'actionable') {
        if (row.status === 'In Sync') return false;
      } else if (status !== 'all' && row.status !== status) {
        return false;
      }
      if (search) {
        const matchesTitle = row.title.toLowerCase().includes(search);
        const matchesDetail = row.detail.toLowerCase().includes(search);
        const matchesId = row.id.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDetail && !matchesId) return false;
      }
      return true;
    });
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS as string[],
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

  private computeCollectionDiffs(
    dbList: IResourceCollectionRow[],
    appList: IResourceCountryBundle['collections'],
  ): IResourceDiffRow[] {
    const rows: IResourceDiffRow[] = [];
    const appMap = new Map((appList || []).map((c) => [c.id, c]));
    const dbMap = new Map(dbList.map((c) => [c.id, c]));

    // Check all DB collections
    for (const dbItem of dbList) {
      const appItem = appMap.get(dbItem.id);
      if (!appItem) {
        rows.push({
          id: dbItem.id,
          kind: 'Collection',
          title: dbItem.title || dbItem.id,
          status: 'Missing in App',
          detail: 'Created in data-system, not yet synced to app bundle',
          dbItem,
        });
      } else {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push(`Title ('${dbItem.title}' vs app '${appItem.title}')`);
        if ((dbItem.description || null) !== (appItem.description || null)) diffs.push('Description changed');
        if ((dbItem.cover_image || null) !== (appItem.cover_image || null)) diffs.push('Cover image changed');
        if ((dbItem.sort_order ?? 1) !== (appItem.sort_order ?? 1)) {
          diffs.push(`Sort order (${dbItem.sort_order ?? 1} vs app ${appItem.sort_order ?? 1})`);
        }

        const dbFiles = [...(dbItem.resource_files || [])].sort();
        const appFiles = [...(appItem.resource_files || [])].sort();
        if (JSON.stringify(dbFiles) !== JSON.stringify(appFiles)) {
          diffs.push(`Files (${dbFiles.length} vs app ${appFiles.length})`);
        }

        const dbLinks = [...(dbItem.resource_links || [])].sort();
        const appLinks = [...(appItem.resource_links || [])].sort();
        if (JSON.stringify(dbLinks) !== JSON.stringify(appLinks)) {
          diffs.push(`Links (${dbLinks.length} vs app ${appLinks.length})`);
        }

        if (diffs.length > 0) {
          rows.push({
            id: dbItem.id,
            kind: 'Collection',
            title: dbItem.title || dbItem.id,
            status: 'Differs',
            detail: diffs.join(', '),
            dbItem,
            appItem,
          });
        } else {
          rows.push({
            id: dbItem.id,
            kind: 'Collection',
            title: dbItem.title || dbItem.id,
            status: 'In Sync',
            detail: `${dbFiles.length} files, ${dbLinks.length} links`,
            dbItem,
            appItem,
          });
        }
      }
    }

    // Check orphaned in app
    for (const appItem of appList || []) {
      if (!dbMap.has(appItem.id)) {
        rows.push({
          id: appItem.id,
          kind: 'Collection',
          title: appItem.title || appItem.id,
          status: 'Orphaned in App',
          detail: 'Present in app bundle, but deleted from data-system',
          appItem,
        });
      }
    }

    return rows;
  }

  private computeFileDiffs(dbList: IResourceFileRow[], appList: IResourceCountryBundle['files']): IResourceDiffRow[] {
    const rows: IResourceDiffRow[] = [];
    const appMap = new Map((appList || []).map((f) => [f.id, f]));
    const dbMap = new Map(dbList.map((f) => [f.id, f]));

    for (const dbItem of dbList) {
      const appItem = appMap.get(dbItem.id);
      if (!appItem) {
        rows.push({
          id: dbItem.id,
          kind: 'File',
          title: dbItem.title || dbItem.filename || dbItem.id,
          status: 'Missing in App',
          detail: 'Uploaded in data-system, not yet synced to app bundle',
          dbItem,
        });
      } else {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push(`Title changed`);
        if ((dbItem.storage_file || null) !== (appItem.storage_file || null)) diffs.push('Storage file changed');
        if ((dbItem.cover_image || null) !== (appItem.cover_image || null)) diffs.push('Cover image changed');
        if ((dbItem.language_code || null) !== (appItem.language_code || null)) diffs.push('Language changed');
        if ((dbItem.external_url || null) !== (appItem.external_url || null)) diffs.push('URL changed');

        if (diffs.length > 0) {
          rows.push({
            id: dbItem.id,
            kind: 'File',
            title: dbItem.title || dbItem.filename || dbItem.id,
            status: 'Differs',
            detail: diffs.join(', '),
            dbItem,
            appItem,
          });
        } else {
          rows.push({
            id: dbItem.id,
            kind: 'File',
            title: dbItem.title || dbItem.filename || dbItem.id,
            status: 'In Sync',
            detail: `${dbItem.mimetype || 'file'} • ${dbItem.size_kb ?? 0} KB`,
            dbItem,
            appItem,
          });
        }
      }
    }

    for (const appItem of appList || []) {
      if (!dbMap.has(appItem.id)) {
        rows.push({
          id: appItem.id,
          kind: 'File',
          title: appItem.title || appItem.filename || appItem.id,
          status: 'Orphaned in App',
          detail: 'Present in app bundle, but deleted from data-system',
          appItem,
        });
      }
    }

    return rows;
  }

  private computeLinkDiffs(dbList: IResourceLinkRow[], appList: IResourceCountryBundle['links']): IResourceDiffRow[] {
    const rows: IResourceDiffRow[] = [];
    const appMap = new Map((appList || []).map((l) => [l.id, l]));
    const dbMap = new Map(dbList.map((l) => [l.id, l]));

    for (const dbItem of dbList) {
      const appItem = appMap.get(dbItem.id);
      if (!appItem) {
        rows.push({
          id: dbItem.id,
          kind: 'Link',
          title: dbItem.title || dbItem.id,
          status: 'Missing in App',
          detail: 'Created in data-system, not yet synced to app bundle',
          dbItem,
        });
      } else {
        const diffs: string[] = [];
        if (dbItem.title !== appItem.title) diffs.push('Title changed');
        if (dbItem.url !== appItem.url) diffs.push('URL changed');
        if (dbItem.type !== appItem.type) diffs.push(`Type (${dbItem.type} vs ${appItem.type})`);
        if ((dbItem.cover_image || null) !== (appItem.cover_image || null)) diffs.push('Cover changed');

        if (diffs.length > 0) {
          rows.push({
            id: dbItem.id,
            kind: 'Link',
            title: dbItem.title || dbItem.id,
            status: 'Differs',
            detail: diffs.join(', '),
            dbItem,
            appItem,
          });
        } else {
          rows.push({
            id: dbItem.id,
            kind: 'Link',
            title: dbItem.title || dbItem.id,
            status: 'In Sync',
            detail: dbItem.url || '',
            dbItem,
            appItem,
          });
        }
      }
    }

    for (const appItem of appList || []) {
      if (!dbMap.has(appItem.id)) {
        rows.push({
          id: appItem.id,
          kind: 'Link',
          title: appItem.title || appItem.id,
          status: 'Orphaned in App',
          detail: 'Present in app bundle, but deleted from data-system',
          appItem,
        });
      }
    }

    return rows;
  }
}
