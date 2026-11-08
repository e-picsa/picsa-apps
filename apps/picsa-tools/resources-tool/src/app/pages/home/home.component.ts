import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import {
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
} from '../../components';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    PicsaTranslateModule,
    MatButtonModule,
    MatIconModule,
    ResourceItemCollectionComponent,
    ResourceItemFileComponent,
    ResourceItemLinkComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  service = inject(ResourcesToolService);
  public collections = this.service.topLevelCollections;
  public unassignedResources = this.service.unassignedResources;

  public unassignedFiles = computed(() => this.unassignedResources().files);
  public unassignedLinks = computed(() => this.unassignedResources().links);
}
