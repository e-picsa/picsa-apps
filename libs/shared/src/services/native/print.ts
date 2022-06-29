import { Injectable } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { Platform } from '@ionic/angular';
import { svgAsPngUri } from 'save-svg-as-png';
import download from 'downloadjs';

// note, import not working so loading from assets in index.html
// import * as html2canvas from "html2canvas";
declare var html2canvas: any;

@Injectable({ providedIn: 'root' })
export class PrintProvider {
  constructor(
    private platform: Platform,
    private socialSharing: SocialSharing
  ) {}

  async socialShareBudget(domSelector: string, title: string) {
    return this.shareHtmlDom(domSelector, title);
  }

  async shareHtmlDom(domSelector: string, title: string) {
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
    setTimeout(async () => {
      const base64 = canvasElm.toDataURL();
      await this.shareDataImage(base64, title);
      body.removeChild(clone);
    }, 200);
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
    if (this.platform.is('cordova')) {
      return this.socialSharing.share('', title, base64Img).then(
        (res: any) => console.log(res),
        (err: any) => console.error(err)
      );
    } else {
      return download(base64Img, title + '.png', 'image/png');
    }
  }
}
