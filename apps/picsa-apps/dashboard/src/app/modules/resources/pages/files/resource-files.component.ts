import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ILocaleDataEntry, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { IDeploymentRow } from '../../../deployment/types';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceFileRow } from '../../types';

type IMergedResources = IResourceFileRow & {
  children: IResourceFileRow[];
  /** All available langauge entries for resource and children */
  languages: ILocaleDataEntry[];
  /** Collections which the resource is a member of */
  collections: IResourceCollectionRow[];
};
const TABLE_COLUMNS: (keyof IMergedResources)[] = [
  'mimetype',
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
  imports: [CommonModule, DashboardMaterialModule, PicsaDataTableComponent, RouterModule, StoragePathPipe, SizeMBPipe],
  templateUrl: './resource-files.component.html',
  styleUrl: './resource-files.component.scss',
})
export class ResourceFilesComponent implements OnInit {
  public resources: IMergedResources[] = [];

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
  constructor(
    private service: ResourcesDashboardService,
    private router: Router,
    private route: ActivatedRoute,
    deploymentService: DeploymentDashboardService
  ) {
    effect(() => {
      const resources = service.files();
      const deployment = deploymentService.activeDeployment();
      if (deployment) {
        // filter for resources targetting same country or marked as global
        const deploymentResources = resources.filter((r) => this.filterDeploymentResource(r, deployment));
        const merged = this.getMergedResources(deploymentResources, deployment);
        const sorted = merged.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
        this.resources = sorted;
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
    return r.country_code === 'global' || r.country_code === deployment.country_code;
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
