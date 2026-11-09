import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { FallbackImageType, PicsaFallbackImageComponent } from '@picsa/components';
import { ILocaleCode, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ResourcesMaterialModule } from '../../../material.module';

export function getLanguageLabel(code?: string): string {
  if (!code) return '';
  const lower = code.toLowerCase();
  if (LOCALES_DATA_HASHMAP[lower as ILocaleCode]) {
    return LOCALES_DATA_HASHMAP[lower as ILocaleCode].language_label;
  }
  const match = LOCALES_DATA.find((l) => l.language_code === lower || l.id === lower);
  if (match) {
    return match.language_label;
  }
  return code.toUpperCase();
}

@Component({
  selector: 'resource-item-link',
  templateUrl: 'link.html',
  styleUrls: ['link.scss'],
  imports: [ResourcesMaterialModule, MatCardModule, MatIconModule, PicsaTranslateModule, PicsaFallbackImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceItemLinkComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resource = input.required<any>();

  public imageFailed = signal(false);

  shareUrl = computed<string>(() => {
    const { url, subtype } = this.resource();
    // ignore internal links
    if (subtype === 'internal') return '';
    // resolve play store url
    if (subtype === 'play_store') return this.resolvePlayStoreUrl(url);
    return url as string;
  });

  description = computed<string>(() => {
    return this.resource().description || '';
  });

  language = computed<string>(() => {
    return this.resource().language || this.resource().language_code || '';
  });

  languageLabel = computed<string>(() => {
    return getLanguageLabel(this.language());
  });

  fileSizeText = computed<string>(() => {
    const sizeKb = this.resource().size_kb;
    if (!sizeKb) return '';
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(1)} MB`;
    }
    return `${sizeKb} KB`;
  });

  coverImage = computed<string>(() => {
    const raw = this.resource().cover?.image;
    if (!raw) return '';
    try {
      return encodeURI(decodeURI(raw));
    } catch {
      return raw;
    }
  });

  fallbackInfo = computed<{
    badge: string;
    type: FallbackImageType;
    label?: string;
  }>(() => {
    const res = this.resource();
    const type = res.rawType || res.type;
    const subtype = res.fileSubtype || res.subtype;
    const mimetype = res.mimetype;

    if (type === 'collection') {
      return {
        badge: 'Collection',
        type: 'folder',
        label: 'Collection',
      };
    }

    if (subtype === 'video' || mimetype === 'video/mp4') {
      return {
        badge: 'Video',
        type: 'video',
      };
    }

    if (subtype === 'pdf' || mimetype === 'application/pdf') {
      return {
        badge: 'PDF',
        type: 'pdf',
      };
    }

    if (subtype === 'play_store') {
      return {
        badge: 'App',
        type: 'app',
      };
    }

    if (type === 'file') {
      return {
        badge: 'Doc',
        type: 'document',
      };
    }

    return {
      badge: 'Link',
      type: 'link',
    };
  });

  onImageError() {
    this.imageFailed.set(true);
  }

  /** Check if any existing click handlers already bound to element to use as override */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() click: EventEmitter<any> = new EventEmitter<any>();

  /** Specific icons to use as action buttons below link. Used when main image not fully indicative of link type */
  public actionButtons: { [type: string]: { matIcon?: string; svgIcon?: string } | null } = {
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
    // TODO - if running standalone resources will not be available, consider UI or rewrite to picsa app
    return this.router.navigateByUrl(url);
  }

  public resolvePlayStoreUrl(appIdOrUrl: string): string {
    if (appIdOrUrl.startsWith('http://') || appIdOrUrl.startsWith('https://')) {
      return appIdOrUrl;
    }
    return `https://play.google.com/store/apps/details?id=${appIdOrUrl}`;
  }

  /** Open play store url with default browser */
  private goToApp(appIdOrUrl: string) {
    const url = this.resolvePlayStoreUrl(appIdOrUrl);
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
