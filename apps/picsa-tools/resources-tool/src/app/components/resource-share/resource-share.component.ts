import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { RxAttachment } from 'rxdb';

import { IResourceFile } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

@Component({
  selector: 'resource-share',
  templateUrl: './resource-share.component.html',
  styleUrls: ['./resource-share.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceShareComponent {
  public attachment?: RxAttachment<IResourceFile>;

  link = input.required<string>();
  uri = input<string>();

  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}

  public async share() {
    // on native prefer to share file directly
    const uri = this.uri();
    if (Capacitor.isNativePlatform() && uri) {
      this.service.shareFileNative(uri);
      // fallback to sharing link on web and non-file type
    } else {
      this.service.shareLink(this.link());
    }
  }
}
