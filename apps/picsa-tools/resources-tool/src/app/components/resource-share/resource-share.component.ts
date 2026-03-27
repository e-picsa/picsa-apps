import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RxDocument } from 'rxdb';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-share',
  templateUrl: './resource-share.component.html',
  styleUrls: ['./resource-share.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class ResourceShareComponent {
  public service = inject(ResourcesToolService);

  public doc = input.required<RxDocument<IResourceFile>>();
}
