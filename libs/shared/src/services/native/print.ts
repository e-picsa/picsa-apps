import { Injectable } from '@angular/core';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { svgAsPngUri } from 'save-svg-as-png';
import download from 'downloadjs';

import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { _wait } from '@picsa/utils';

@Injectable({ providedIn: 'root' })
export class PrintProvider {
  constructor(private socialSharing: SocialSharing) {}

  public async shareHtmlDom(domSelector: string, title: string) {
    const domEl = document.querySelector(domSelector) as HTMLElement;
    const clone = domEl.cloneNode(true) as HTMLElement;
    clone.classList.toggle('print-mode');
    // add title
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    clone.prepend(titleEl);
    // attach clone, generate svg and export
    const body = document.querySelector('body') as HTMLBodyElement;
    body.prepend(clone);
    // allow taint for rendering svgs, see https://github.com/niklasvh/html2canvas/issues/95
    const canvasElm = await html2canvas(clone, { allowTaint: true });
    // use set timeout to ensure resizing complete
    // TODO - check if required or if better solution could exist
    await _wait(200);
    const base64 = canvasElm.toDataURL();
    body.removeChild(clone);
    return this.shareDataImage(base64, title);
  }

  async shareSVG(svgDomSelector: string, title: string) {
    const svg = document.getElementById(svgDomSelector) as HTMLElement;
    const options = {
      // remove canvg as doesn't support background colours
      // canvg: canvg,
      scale: 2,
      backgroundColor: 'white',
      selectorRemap: (s: string) => s.replace(/\.c3((-)?[\w.]*)*/g, ''),
      // modify selector-properties
      modifyCss: (s: string, p: string) => {
        // modifyCss is used to take stylesheet classes that apply to svgElements and make inline
        // use remap so that .c3-axis-y-label text detects the 'text' svg element
        // NOTE - some properties don't work quite right (override other defaults)
        const overrides = ['.c3 svg', '.c3-grid text'];
        if (overrides.includes(s)) {
          return;
        }
        s = s.replace(/\.c3((-)?[\w.]*)*/g, '');

        return s + '{' + p + '}';
      },
    };
    const pngUri = await svgAsPngUri(svg, options);
    // const imgEl = document.createElement('img');
    // imgEl.src = pngUri;
    // document.querySelector('body').prepend(imgEl);
    await this.shareDataImage(pngUri, title);
  }

  private async shareDataImage(base64Img: string, title: string) {
    if (Capacitor.isNativePlatform()) {
      return this.socialSharing.share('', title, base64Img);
    } else {
      return download(base64Img, title + '.png', 'image/png');
    }
  }
}
