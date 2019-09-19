import { Injectable } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { Platform } from '@ionic/angular';
import { saveAs } from 'file-saver';
// note, import not working so loading from assets in index.html
// import * as html2canvas from "html2canvas";
declare var html2canvas: any;

@Injectable({ providedIn: 'root' })
export class PrintProvider {
  constructor(
    private platform: Platform,
    private socialSharing: SocialSharing
  ) {}

  // convert a dom selector to canvas and share as image using social sharing
  async socialShare(domSelector: string, filename: string) {
    const domEl: HTMLElement = document.querySelector(domSelector);
    const canvasElm = await html2canvas(domEl);
    this.shareCanvasImage(canvasElm, filename);
  }

  // similar method to above but add filename title to top of canvas
  async socialShareBudget(domSelector: string, title: string) {
    const domEl: HTMLElement = document.querySelector(domSelector);
    const clone = domEl.cloneNode(true) as HTMLElement;
    clone.classList.toggle('print-mode');
    // add title
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    clone.prepend(titleEl);
    // attach clone, generate svg and export
    const body = document.querySelector('body');
    body.appendChild(clone);
    // allow taint for rendering svgs, see https://github.com/niklasvh/html2canvas/issues/95
    const canvasElm = await html2canvas(clone, { allowTaint: true });
    // use set timeout to ensure resizing complete
    // TODO - check if required or if better solution could exist
    setTimeout(async () => {
      await this.shareCanvasImage(canvasElm, title);
      body.removeChild(clone);
    }, 200);
  }

  async shareCanvasImage(canvasElm: HTMLCanvasElement, title: string) {
    const base64 = canvasElm.toDataURL();
    if (this.platform.is('cordova')) {
      return this.socialSharing
        .share('', title, base64)
        .then(res => console.log(res), err => console.error(err));
    } else {
      return this.downloadCanvasImage(canvasElm, title);
    }
  }

  async downloadCanvasImage(canvasElm: HTMLCanvasElement, filename: string) {
    canvasElm.toBlob(blob => {
      // on error null blob created
      if (blob) {
        saveAs(blob, `${filename}.png`);
      } else {
        throw new Error('could not create download');
      }
    });
  }
  // if (this.platform.is("cordova")) {
  //   // *** not working, blob seems correct but writes empty json
  //   // similarly 'saveAs' function says downloading but no file generated
  //   canvasElm.toBlob(async blob => {
  //     console.log("blob created", blob);
  //     const filePath = await this.filePrvdr.createFile(
  //       `budget-${filename}.png`,
  //       blob,
  //       true,
  //       true
  //     );
  //     console.log("file created", filePath);
  //     this.filePrvdr.openFileCordova(filePath);
  //   });
  // }
  // }
  // }
}
