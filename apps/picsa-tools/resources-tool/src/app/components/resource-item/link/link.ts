import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';

import { IResourceLink } from '../../../schemas';

@Component({
  selector: 'resource-item-link',
  templateUrl: 'link.html',
  styleUrls: ['link.scss'],
})
export class ResourceItemLinkComponent {
  @Input() resource: IResourceLink;

  /** Check if any existing click handlers already bound to element to use as override */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() click: EventEmitter<any> = new EventEmitter<any>();

  constructor(private router: Router, private route: ActivatedRoute) {}

  /** Specific icons to use as action buttons below link. Used when main image not fully indicative of link type */
  public actionButtons: { [type in IResourceLink['subtype']]: { matIcon?: string; svgIcon?: string } | null } = {
    /** Facebook links usually have facebook logo in main image so ignore action button */
    facebook: null,
    internal: null,
    play_store: { svgIcon: 'picsa_play_store' },
    website: null,
    whatsapp: null,
    youtube: null,
  };

  public handleClick() {
    // If (click) binding present on element ignore own methods
    if (this.click.observed) return;
    switch (this.resource.subtype) {
      case 'internal':
        return this.handleInternalLink(this.resource.url);
      case 'play_store': {
        return this.goToApp(this.resource.url);
      }
      default:
        return this.handleExternalLink(this.resource.url);
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
    if (this.route.snapshot.paramMap.get('collectionId')) {
      this.router.navigate([id], {
        relativeTo: this.route,
      });
    }
    // Route from base to collection
    else {
      this.router.navigate(['collection', id], {
        relativeTo: this.route,
      });
    }
  }
}
