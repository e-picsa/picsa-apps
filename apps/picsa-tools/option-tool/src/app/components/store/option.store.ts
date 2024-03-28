import { Injectable, OnDestroy } from '@angular/core';
import { PrintProvider } from '@picsa/shared/services/native/print';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OptionStore implements OnDestroy {
  private destroyed$ = new Subject<boolean>();

  constructor(private printPrvdr: PrintProvider) {}

  public async shareAsImage() {
    return this.printPrvdr.shareHtmlDom('#options', 'Options', '');
  }
  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
