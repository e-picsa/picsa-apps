import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';
import { IBudgetCardDB } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-card-image',
  templateUrl: 'budget-card-image.html',
  styleUrls: ['budget-card-image.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BudgetCardImageComponent implements OnInit, OnDestroy {
  @Input() card: IBudgetCardDB;
  imgData: SafeHtml;
  imgUrl: SafeUrl;
  objUrl: string;
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.card.customMeta) {
      this.imgData = this.convertSVGToImageData(this.card.customMeta.imgData);
    } else {
      this.loadImageFromFile();
    }
  }

  ngOnDestroy(): void {
    //  revoke imgURL to prevent memory leaks
    if (this.objUrl) {
      URL.revokeObjectURL(this.objUrl);
    }
  }

  private async loadImageFromFile() {
    const imgBlob = await this.getCardImg(this.card.id, this.card.imgType);
    this.objUrl = URL.createObjectURL(imgBlob);
    this.imgUrl = this.sanitizer.bypassSecurityTrustUrl(this.objUrl);
    // as parent cell using onpush strategy extra check required here (not entirely sure why)
    this.cdr.markForCheck();
  }

  // check card images for correct svg or png image and return
  private async getCardImg(
    imageId: string,
    imageType: 'svg' | 'png' = 'png'
  ): Promise<Blob> {
    let imgData: Blob;
    // first see if svg exists
    try {
      imgData = await this.http
        .get(`../../assets/images/${imageId}.${imageType}`, {
          responseType: 'blob'
        })
        .toPromise();
    } catch (error) {
      // otherwise placeholder
      imgData = await this.http
        .get(`../../assets/images/no-image.png`, { responseType: 'blob' })
        .toPromise();
    }
    return imgData;
  }

  // svgs can't be embedded programatically (angular sanitize limitation)
  // so convert to html that embeds within an <img> tag and div innerhtml
  private convertSVGToImageData(svgTag?: string) {
    const encodedSVG = this._encodeSVG(svgTag);
    const Html = `<img class='card-image' style='width:100%;height:100%;' src="data:image/svg+xml,${encodedSVG}"/>`;
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
