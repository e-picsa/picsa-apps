import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { IResourceLink } from '../../../schemas';
import { ResourceShareComponent } from '../../resource-share/resource-share.component';

@Component({
  selector: 'resource-item-link',
  templateUrl: 'link.html',
  styleUrls: ['link.scss'],
  imports: [MatCardModule, MatIconModule, PicsaTranslateModule, ResourceShareComponent],
})
export class ResourceItemLinkComponent {
  resource = input.required<IResourceLink>();

  shareUrl = computed<string>(() => {
    const { url, subtype } = this.resource();
    // ignore internal links
    if (subtype === 'internal') return '';
    // add play store url prefix
    if (subtype === 'play_store') return `https://play.google.com/store/apps/details?id=${url}`;
    return url as string;
  });

  description = computed<string>(() => {
    return this.resource().description || '';
  });
  language = computed<string>(() => {
    return this.resource().language || '';
  });

  /** Check if any existing click handlers already bound to element to use as override */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() click: EventEmitter<any> = new EventEmitter<any>();

  constructor(private router: Router, private route: ActivatedRoute) {}

  /** Specific icons to use as action buttons below link. Used when main image not fully indicative of link type */
  public actionButtons: { [type in IResourceLink['subtype']]: { matIcon?: string; svgIcon?: string } | null } = {
    /** Facebook links usually have facebook logo in main image so ignore action button */
    facebook: null,
    internal: null,
    play_store: { svgIcon: 'resources_tool:play_store' },
    website: null,
    whatsapp: null,
    youtube: null,
  };

  public handleClick() {
    // If (click) binding present on element ignore own methods
    if (this.click.observed) return;
    switch (this.resource().subtype) {
      case 'internal':
        return this.handleInternalLink(this.resource().url);
      case 'play_store': {
        return this.goToApp(this.resource().url);
      }
      default:
        return this.handleExternalLink(this.resource().url);
    }
  }

  private handleExternalLink(url: string) {
    return Browser.open({ url });
  }

  private handleInternalLink(url: string) {
    if (url.startsWith('/resources/collection/')) {
      return this.goToCollection(url.replace('/resources/collection/', ''));
    }
    // TODO - if running standalone resources will not be available, consider UI or rewrite to picsa extension app
    return this.router.navigateByUrl(url);
  }

  /** Resource url only stores appId so update for fully qualified play path and open with default browser */
  private goToApp(appId: string) {
    const url = `https://play.google.com/store/apps/details?id=${appId}`;
    return Browser.open({ url });
  }

  /** Internal collection urls may have to replace current page id depending on  */
  private goToCollection(id: string) {
    // Route from existing collection
    if (this.route.snapshot.paramMap.get('collectionId')) {
      return this.router.navigate([id], {
        relativeTo: this.route,
      });
    }
    // Route from /search
    if (this.route.snapshot.routeConfig?.path?.endsWith('/search')) {
      return this.router.navigate(['../', 'collection', id], { relativeTo: this.route });
    }
    // Route from base to collection
    return this.router.navigate(['collection', id], {
      relativeTo: this.route,
    });
  }
}
