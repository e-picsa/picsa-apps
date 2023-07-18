import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { catchError, firstValueFrom } from 'rxjs';

import { IBudgetCard } from '../../../schema';

@Component({
  selector: 'budget-card-image',
  templateUrl: 'budget-card-image.html',
  styleUrls: ['budget-card-image.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetCardImageComponent implements OnInit, OnDestroy {
  @Input() card: IBudgetCard;
  imgData: SafeHtml;
  imgUrl: SafeUrl;
  objUrl: string;
  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

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
    const imageId = this.card.imgId ?? this.card.id;
    const imgBlob = await this.getCardImg(imageId, this.card.imgType);
    if (imgBlob) {
      this.objUrl = URL.createObjectURL(imgBlob);
      this.imgUrl = this.sanitizer.bypassSecurityTrustUrl(this.objUrl);
      this.cdr.markForCheck();
    }
  }

  // check card images for correct svg or png image and return
  private async getCardImg(imageId: string, imageType: 'svg' | 'png' = 'png'): Promise<Blob | null> {
    // first see if svg exists
    const targetImg = `assets/budget-cards/${imageId}.${imageType}`;
    const fallbackImg = 'assets/budget-cards/no-image.png';
    const imgData = await firstValueFrom(
      this.http.get(targetImg, { responseType: 'blob' }).pipe(
        // send fallback image on error
        catchError(() => this.http.get(fallbackImg, { responseType: 'blob' }))
      )
    );
    return imgData;
  }

  // svgs can't be embedded programatically (angular sanitize limitation)
  // so convert to html that embeds within an <img> tag and div innerhtml
  private convertSVGToImageData(svgTag: string) {
    const encodedSVG = this._encodeSVG(svgTag);
    const Html = `<img class='card-image' style='width:100%;height:100%;' src="data:image/svg+xml,${encodedSVG}"/>`;
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
