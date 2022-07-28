import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
}
export interface IBreadcrumbOptions {
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

  public hideBreadcrumb(path: string) {
    const options = this.breadcrumbOptions$.value;
    options.hideOnPaths ??= {};
    options.hideOnPaths[path] = true;
    this.breadcrumbOptions$.next(options);
  }
}
