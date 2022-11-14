import { Portal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
  /** Use angular portal cdk to inject component into header slot */
  endContent?: Portal<any>;
}
export interface IBreadcrumbOptions {
  enabled?: boolean;
  hideOnPaths?: { [path: string]: true };
}

@Injectable({ providedIn: 'root' })
export class PicsaCommonComponentsService {
  headerOptions$ = new BehaviorSubject<IHeaderOptions>({});
  breadcrumbOptions$ = new BehaviorSubject<IBreadcrumbOptions>({});

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
}
