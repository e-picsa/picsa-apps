import { Component, Input, OnInit, OnDestroy, Sanitizer } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'budget-card-image',
  templateUrl: 'budget-card-image.html',
  styleUrls: ['budget-card-image.scss']
})
export class BudgetCardImageComponent implements OnInit, OnDestroy {
  @Input() imageId: string;
  @Input() imageData: string;
  @Input() format: 'svg' | 'png' = 'png';
  imgUrl: SafeUrl;
  objUrl: string;
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (!this.imageData) {
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
    const imgBlob = await this.getCardImg(this.imageId, this.format);
    this.objUrl = URL.createObjectURL(imgBlob);
    this.imgUrl = this.sanitizer.bypassSecurityTrustUrl(this.objUrl);
  }

  // check card images for correct svg or png image and return
  private async getCardImg(
    imageId: string,
    format: 'svg' | 'png'
  ): Promise<Blob> {
    let imgData: Blob;
    // first see if svg exists
    try {
      imgData = await this.http
        .get(`../../assets/images/${imageId}.${format}`, {
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
}
