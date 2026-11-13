import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../auth';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow } from '../../types';

export interface ICollectionTableRow extends IResourceCollectionRow {
  files_count: number;
  links_count: number;
}

const DISPLAY_COLUMNS: (keyof ICollectionTableRow)[] = [
  'cover_image',
  'title',
  'description',
  'resource_files',
  'resource_links',
  'modified_at',
];

@Component({
  selector: 'dashboard-resource-collections',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    PicsaDataTableComponent,
    RouterModule,
    StoragePathPipe,
    AuthRoleRequiredDirective,
  ],
  templateUrl: './resource-collections.component.html',
  styleUrl: './resource-collections.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCollectionsComponent implements OnInit {
  public service = inject(ResourcesDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private deploymentService = inject(DeploymentDashboardService);

  public activeCountry = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    return deployment?.label || deployment?.country_code?.toUpperCase() || '';
  });

  public collections = computed<ICollectionTableRow[]>(() => {
    const rawCollections = [...this.service.collections()];
    const sorted = rawCollections.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));

    return sorted.map((col) => ({
      ...col,
      files_count: col.resource_files?.length ?? 0,
      links_count: col.resource_links?.length ?? 0,
    }));
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS as string[],
    handleRowClick: (collection: ICollectionTableRow, e) => {
      e.stopImmediatePropagation();
      this.router.navigate([collection.id], { relativeTo: this.route });
    },
    formatHeader: (v) => {
      switch (v) {
        case 'resource_files':
          return 'Files';
        case 'resource_links':
          return 'Links';
        case 'modified_at':
          return 'Updated';
        default:
          return formatHeaderDefault(v);
      }
    },
  };

  async ngOnInit() {
    await this.service.ready();
  }
}
