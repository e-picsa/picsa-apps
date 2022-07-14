import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

interface IHeaderOptions {
  title?: string;
  style?: 'inverted' | 'primary';
}

@Injectable({ providedIn: 'root' })
export class PicsaCommonComponentsService {
  headerOptions$ = new Subject<IHeaderOptions>();

  /** Programatically set the header title */
  public setHeader(options: Partial<IHeaderOptions>) {
    this.headerOptions$.next(options);
  }
}
