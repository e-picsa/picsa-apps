import { Injectable } from "@angular/core";
import { SocialSharing } from "@ionic-native/social-sharing/ngx";
import { Platform } from "@ionic/angular";
import { saveAs } from "file-saver";
// note, import not working so loading from assets in index.html
// import * as html2canvas from "html2canvas";
declare var html2canvas: any;

@Injectable({ providedIn: "root" })
export class PrintProvider {
  constructor(
    private platform: Platform,
    private socialSharing: SocialSharing
  ) {
    console.log("html2canvas", html2canvas);
  }

  // convert a dom selector to canvas and share as image using social sharing
  async socialShare(domSelector: string, filename: string) {
    const domEl: HTMLElement = document.querySelector(domSelector);
    const canvasElm = await html2canvas(domEl);
    this.shareCanvasImage(canvasElm, filename);
  }

  // similar method to above but add filename title to top of canvas
  async socialShareBudget(domSelector: string, title: string) {
    const domEl: HTMLElement = document.querySelector(domSelector);
    domEl.classList.toggle("print-mode");
    const width = domEl.offsetWidth;
    const canvasElm = await html2canvas(domEl);
    // add title
    const ctx = canvasElm.getContext("2d");
    ctx.font = "30px Arial";
    ctx.textAlign = "start";
    ctx.fillText(title, width / 2, 43);
    await this.shareCanvasImage(canvasElm, title);
    domEl.classList.toggle("print-mode");
  }

  async shareCanvasImage(canvasElm: HTMLCanvasElement, title: string) {
    const base64 = canvasElm.toDataURL();
    if (this.platform.is("cordova")) {
      this.socialSharing
        .share("", title, base64)
        .then(res => console.log(res), err => console.error(err));
    } else {
      this.downloadCanvasImage(canvasElm, title);
    }
  }

  async downloadCanvasImage(canvasElm: HTMLCanvasElement, filename: string) {
    canvasElm.toBlob(blob => {
      // on error null blob created
      if (blob) {
        saveAs(blob, `${filename}.png`);
      } else {
        throw new Error("could not create download");
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
