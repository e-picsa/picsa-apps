import { DomPortal, TemplatePortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
  /** Angular portal cdk to inject component into header central slot */
  cdkPortalEnd?: DomPortal<HTMLElement> | TemplatePortal<unknown>;
  cdkPortalCenter?: DomPortal<HTMLElement> | TemplatePortal<unknown>;

  hideBackButton?: boolean;
}
export interface IBreadcrumbOptions {
  enabled?: boolean;
  hideOnPaths?: { [path: string]: true };
}

@Injectable({ providedIn: 'root' })
export class PicsaCommonComponentsService {
  headerOptions$ = new BehaviorSubject<IHeaderOptions>({});
  breadcrumbOptions$ = new BehaviorSubject<IBreadcrumbOptions>({});

  /** Track navigation history - used by back-button components (multi-instance) */
  public navHistory: string[] = [];

  /** Programatically set the header options such as title and style */
  public setHeader(options: Partial<IHeaderOptions>) {
    this.headerOptions$.next(options);
  }
  /** Update partial header options, retaining existing options where not defined */
  public patchHeader(update: Partial<IHeaderOptions>) {
    this.setHeader({ ...this.headerOptions$.value, ...update });
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
