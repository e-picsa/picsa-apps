import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ResourceItemCollectionComponent } from '../../components';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [PicsaTranslateModule, MatButtonModule, MatIconModule, ResourceItemCollectionComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  service = inject(ResourcesToolService);
  public collections = this.service.topLevelCollections;
}
