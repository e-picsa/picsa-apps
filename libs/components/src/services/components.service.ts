import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
}
export interface IBreadcrumbOptions {
  enabled?: boolean;
  hideOnPaths?: { [path: string]: true };
}

@Injectable({ providedIn: 'root' })
export class PicsaCommonComponentsService {
  headerOptions$ = new BehaviorSubject<IHeaderOptions>({});
  breadcrumbOptions$ = new BehaviorSubject<IBreadcrumbOptions>({});

  /** Programatically set the header title */
  public setHeader(options: Partial<IHeaderOptions>) {
    this.headerOptions$.next(options);
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
