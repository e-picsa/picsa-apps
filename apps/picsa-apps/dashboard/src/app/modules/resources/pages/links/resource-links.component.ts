import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { AuthRoleRequiredDirective } from '../../../auth';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceLinkRow } from '../../types';

export type IMergedResourceLink = IResourceLinkRow & {
  collections: IResourceCollectionRow[];
};

const DISPLAY_COLUMNS: (keyof IMergedResourceLink)[] = [
  'type',
  'cover_image',
  'title',
  'description',
  'collections',
  'url',
  'modified_at',
];

@Component({
  selector: 'dashboard-resource-links',
  imports: [
    CommonModule,
    DashboardMaterialModule,
    PicsaDataTableComponent,
    RouterModule,
    StoragePathPipe,
    AuthRoleRequiredDirective,
  ],
  templateUrl: './resource-links.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceLinksComponent implements OnInit {
  private service = inject(ResourcesDashboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private deploymentService = inject(DeploymentDashboardService);

  public activeCountry = computed(() => {
    const deployment = this.deploymentService.activeDeployment();
    return deployment?.label || deployment?.country_code?.toUpperCase() || '';
  });

  public collectionFilter = signal<'all' | 'in_collection' | 'unassigned'>('all');

  private allLinks = signal<IMergedResourceLink[]>([]);

  public links = computed(() => {
    const filter = this.collectionFilter();
    const list = this.allLinks();
    if (filter === 'in_collection') {
      return list.filter((l) => (l.collections?.length ?? 0) > 0);
    }
    if (filter === 'unassigned') {
      return list.filter((l) => (l.collections?.length ?? 0) === 0);
    }
    return list;
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS as string[],
    handleRowClick: (row: IMergedResourceLink) => this.router.navigate([row.id], { relativeTo: this.route }),
  };

  constructor() {
    effect(() => {
      const links = this.service.links();
      const merged: IMergedResourceLink[] = links.map((l) => ({
        ...l,
        collections: this.service.getResourceCollections('links', l.id),
      }));
      const sorted = merged.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
      this.allLinks.set(sorted);
    });
  }

  async ngOnInit() {
    await this.service.ready();
  }

  public handleCollectionClick(e: Event, collection: IResourceCollectionRow) {
    e.stopImmediatePropagation();
    this.router.navigate(['..', 'collections', collection.id], { relativeTo: this.route });
  }
}
