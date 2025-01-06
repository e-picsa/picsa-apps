import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceLinkRow } from '../../types';

const DISPLAY_COLUMNS: (keyof IResourceLinkRow)[] = [
  'type',
  'cover_image',
  'title',
  'description',
  // 'sort_order',
  'url',
  'modified_at',
];

@Component({
  selector: 'dashboard-resource-links',
  imports: [
    CommonModule,
    CommonModule,
    DashboardMaterialModule,
    PicsaDataTableComponent,
    RouterModule,
    StoragePathPipe,
  ],
  templateUrl: './resource-links.component.html',
  styleUrl: './resource-links.component.scss',
})
export class ResourceLinksComponent implements OnInit {
  public links: IResourceLinkRow[] = [];
  public tableOptions: IDataTableOptions = {
    displayColumns: DISPLAY_COLUMNS,
    handleRowClick: (row: IResourceLinkRow) => this.router.navigate([row.id], { relativeTo: this.route }),
  };

  constructor(private service: ResourcesDashboardService, private router: Router, private route: ActivatedRoute) {
    effect(() => {
      const links = service.links();
      this.links = links.sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
    });
  }
  async ngOnInit() {
    await this.service.ready();
  }
}
