import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaDialogLoading } from './dialogs';
import Loaders from './loaders';
import { DomSanitizer } from '@angular/platform-browser';
import { IPicsaLoaders, IPicsaDialogConfig } from './dialog.models';

@Injectable({
  providedIn: 'root'
})
export class PicsaDialogService {
  loaders: IPicsaLoaders;
  constructor(private dialog: MatDialog, private sanitizer: DomSanitizer) {
    this.loaders = {
      bars: this.convertSVGToImageData(Loaders.BARS)
    };
  }

  /**********************************************************************
   *  Public Methods
   ***********************************************************************/

  async open(dialog: keyof typeof PICSA_DIALOGS, config: any = {}) {
    // make default loaders available to all dialogs
    config.data = { ...config.data, loaders: this.loaders };
    const dialogRef = this.dialog.open(
      PICSA_DIALOGS[dialog],
      config as IPicsaDialogConfig
    );
    await dialogRef.afterOpened();
    return dialogRef;
  }

  /**********************************************************************
   *  Helper Methods
   ***********************************************************************/

  private convertSVGToImageData(svgTag: string) {
    const encodedSVG = this._encodeSVG(svgTag);
    const Html = `<img src="data:image/svg+xml,${encodedSVG}"/>`;
    return this.sanitizer.bypassSecurityTrustHtml(Html);
  }

  // method taken from http://yoksel.github.io/url-encoder/
  // applies selective replacement of uri characters
  private _encodeSVG(data: string): string {
    const symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;
    data = data.replace(/"/g, "'");
    data = data.replace(/>\s{1,}</g, '><');
    data = data.replace(/\s{2,}/g, ' ');
    return data.replace(symbols, encodeURIComponent);
  }
}

const PICSA_DIALOGS = {
  loading: PicsaDialogLoading
};
