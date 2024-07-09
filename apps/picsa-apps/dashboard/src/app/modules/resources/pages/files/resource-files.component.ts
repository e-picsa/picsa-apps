import { CommonModule } from '@angular/common';
import { Component, effect, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { SizeMBPipe } from '@picsa/shared/pipes/sizeMB';
import { StoragePathPipe } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../../../material.module';
import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { ResourcesDashboardService } from '../../resources.service';
import { IResourceCollectionRow, IResourceFileRow } from '../../types';

type IMergedResources = IResourceFileRow & {
  children: IResourceFileRow[];
  /** All available langauge codes for resource and children */
  language_codes: string[];
  /** Collections which the resource is a member of */
  collections: IResourceCollectionRow[];
};
const TABLE_COLUMNS: (keyof IMergedResources)[] = [
  'mimetype',
  'title',
  'size_kb',
  'language_codes',
  'collections',
  'external_url',
  'modified_at',
  // sort_order
];

@Component({
  selector: 'dashboard-resource-files',
  standalone: true,
  imports: [
    CommonModule,
    DashboardMaterialModule,
    DashboardResourcesStorageLinkComponent,
    PicsaDataTableComponent,
    RouterModule,
    StoragePathPipe,
    SizeMBPipe,
  ],
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
      if (value === 'language_codes') return 'Languages';
      if (value === 'modified_at') return 'Updated';
      return formatHeaderDefault(value);
    },
  };
  constructor(private service: ResourcesDashboardService, private router: Router, private route: ActivatedRoute) {
    effect(() => {
      const resources = service.files();
      this.resources = this.getMergedResources(resources).sort((a, b) => (b.modified_at > a.modified_at ? 1 : -1));
    });
  }

  async ngOnInit() {
    await this.service.ready();
  }

  /** */
  private getMergedResources(resources: IResourceFileRow[]): IMergedResources[] {
    return resources.map((r) => {
      const children = this.service.getChildResources(r.id);
      const collections = this.service.getResourceCollections('files', r.id);
      const language_codes: string[] = [];
      if (r.language_code) language_codes.push(r.language_code);
      for (const { language_code, modified_at } of children) {
        // set language codes from child resources
        if (language_code && !language_codes.includes(language_code)) {
          language_codes.push(language_code);
        }
        // set modified_at as most recent child resource (if newer)
        if (modified_at > r.modified_at) {
          r.modified_at = modified_at;
        }
      }

      return { ...r, language_codes, children, collections };
    });
  }
}
