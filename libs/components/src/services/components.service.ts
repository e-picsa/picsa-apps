import { DomPortal, TemplatePortal } from '@angular/cdk/portal';
import { Injectable, signal } from '@angular/core';
import { isEqual } from '@picsa/utils/object.utils';
import { BehaviorSubject } from 'rxjs';

export interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
  /** Angular portal cdk to inject component into header slots */
  cdkPortalStart?: DomPortal<HTMLElement> | TemplatePortal<unknown>;
  cdkPortalEnd?: DomPortal<HTMLElement> | TemplatePortal<unknown>;
  cdkPortalCenter?: DomPortal<HTMLElement> | TemplatePortal<unknown>;

  hideBackButton?: boolean;
  hideHeader?: boolean;
}
export interface IBreadcrumbOptions {
  enabled?: boolean;
  hideOnPaths?: { [path: string]: true };
}

@Injectable({ providedIn: 'root' })
export class PicsaCommonComponentsService {
  headerOptions = signal<IHeaderOptions>({}, { equal: isEqual });
  breadcrumbOptions$ = new BehaviorSubject<IBreadcrumbOptions>({});

  /** Track navigation history - used by back-button components (multi-instance) */
  public navHistory: string[] = [];

  /** Programatically set the header options such as title and style */
  public setHeader(options: Partial<IHeaderOptions>) {
    this.headerOptions.set(options);
  }
  /** Update partial header options, retaining existing options where not defined */
  public patchHeader(update: Partial<IHeaderOptions>) {
    this.setHeader({ ...this.headerOptions(), ...update });
  }

  public updateBreadcrumbOptions(update: Partial<IBreadcrumbOptions>) {
    const options = this.breadcrumbOptions$.value;
    const updated: IBreadcrumbOptions = {
      ...options,
      ...update,
      hideOnPaths: {
        ...options.hideOnPaths,
        ...update.hideOnPaths,
      },
    };
    this.breadcrumbOptions$.next(updated);
  }

  public back() {
    // access to back implementation provided by back-button component (will be overridden)
    console.warn('No back method specified');
  }
}
