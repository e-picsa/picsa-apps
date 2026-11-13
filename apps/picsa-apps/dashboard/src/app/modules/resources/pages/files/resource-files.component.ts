import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PicsaFallbackImageComponent } from '@picsa/components';
import { ILocaleDataEntry, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../auth';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { IDeploymentRow } from '../../../deployment/types';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceFileRow } from '../../types';
import { getFileFallbackType } from '../../utils';

type IMergedResources = IResourceFileRow & {
  children: IResourceFileRow[];
  /** All available langauge entries for resource and children */
  languages: ILocaleDataEntry[];
  /** Collections which the resource is a member of */
  collections: IResourceCollectionRow[];
};
const TABLE_COLUMNS: (keyof IMergedResources)[] = [
  'mimetype',
  'cover_image',
  'title',
  'size_kb',
  'languages',
  'collections',
  // 'external_url',
  'modified_at',
  // sort_order
];

@Component({
  selector: 'dashboard-resource-files',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    PicsaDataTableComponent,
    PicsaFallbackImageComponent,
    RouterModule,
    StoragePathPipe,
    SizeMBPipe,
    AuthRoleRequiredDirective,
  ],
  templateUrl: './resource-files.component.html',
  styleUrl: './resource-files.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFilesComponent implements OnInit {
  public readonly getFileFallbackType = getFileFallbackType;
  private service = inject(ResourcesDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private deploymentService = inject(DeploymentDashboardService);

  public activeCountry = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    return deployment?.label || deployment?.country_code?.toUpperCase() || '';
  });

  public collectionFilter = signal<'all' | 'in_collection' | 'unassigned'>('all');

  private allResources = signal<IMergedResources[]>([]);

  public resources = computed(() => {
    const filter = this.collectionFilter();
    const list = this.allResources();
    if (filter === 'in_collection') {
      return list.filter((r) => (r.collections?.length ?? 0) > 0);
    }
    if (filter === 'unassigned') {
      return list.filter((r) => (r.collections?.length ?? 0) === 0);
    }
    return list;
  });

  public readonly tableOptions: IDataTableOptions = {
    displayColumns: TABLE_COLUMNS,
    handleRowClick: (resource: IResourceFileRow) => {
      this.router.navigate([resource.id], { relativeTo: this.route });
    },
    formatHeader(value) {
      if (value === 'mimetype') return 'Type';
      if (value === 'size_kb') return 'Size';
      if (value === 'languages') return 'Languages';
      if (value === 'modified_at') return 'Updated';
      return formatHeaderDefault(value);
    },
  };
  constructor() {
    effect(() => {
      const resources = this.service.files();
      const deployment = this.deploymentService.activeDeployment();
      if (deployment) {
        // filter for resources targetting same country
        const deploymentResources = resources.filter((r) => this.filterDeploymentResource(r, deployment));
        const merged = this.getMergedResources(deploymentResources, deployment);
        const sorted = merged.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
        this.allResources.set(sorted);
      }
    });
  }

  async ngOnInit() {
    await this.service.ready();
  }

  public handleCollectionClick(e: Event, collection: IResourceCollectionRow) {
    e.stopImmediatePropagation();
    this.router.navigate(['..', 'collections', collection.id], { relativeTo: this.route });
  }

  private filterDeploymentResource(r: IResourceFileRow, deployment: IDeploymentRow) {
    return r.country_code === deployment.country_code;
  }

  /** */
  private getMergedResources(resources: IResourceFileRow[], deployment: IDeploymentRow): IMergedResources[] {
    return resources.map((r) => {
      const children = this.service.getChildResources(r.id).filter((r) => this.filterDeploymentResource(r, deployment));

      const collections = this.service.getResourceCollections('files', r.id);

      const languagesHashmap: Record<string, ILocaleDataEntry> = {};
      if (r.language_code && LOCALES_DATA_HASHMAP[r.language_code]) {
        languagesHashmap[r.language_code] = LOCALES_DATA_HASHMAP[r.language_code];
      }
      for (const { language_code, modified_at } of children) {
        // set language codes from child resources
        if (language_code && LOCALES_DATA_HASHMAP[language_code]) {
          languagesHashmap[language_code] = LOCALES_DATA_HASHMAP[language_code];
        }
        // set modified_at as most recent child resource (if newer)
        if (modified_at > r.modified_at) {
          r.modified_at = modified_at;
        }
      }

      return { ...r, languages: Object.values(languagesHashmap), children, collections };
    });
  }
}
