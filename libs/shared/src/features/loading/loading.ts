import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import SVGS from './svgs';

@Component({
  imports: [CommonModule],
  selector: 'picsa-loading',
  templateUrl: './loading.html',
  styleUrls: ['./loading.scss'],
})
export class PicsaLoadingComponent {
  @Input() name: IPicsaLoaders;
  loaderHtml: SafeHtml;
  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const svgName = this.name || 'bars';
    // select svg by name (or use default bars)
    const svg = SVGS[svgName] || SVGS.BARS;
    this.loaderHtml = this.convertSVGToImageData(svg);
  }

  /**********************************************************************
   *  Helper Methods
   ***********************************************************************/

  private convertSVGToImageData(svgTag: string) {
    const encodedSVG = this._encodeSVG(svgTag);
    const Html = `<img style="width:100%" src="data:image/svg+xml,${encodedSVG}"/>`;
    return this.sanitizer.bypassSecurityTrustHtml(Html);
  }

  // method taken from http://yoksel.github.io/url-encoder/
  // applies selective replacement of uri characters
  private _encodeSVG(data: string): string {
    const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
    data = data.replace(/"/g, "'");
    data = data.replace(/>\s{1,}</g, '><');
    data = data.replace(/\s{2,}/g, ' ');
    return data.replace(symbols, encodeURIComponent);
  }
}

export type IPicsaLoaders = 'bars';
