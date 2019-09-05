import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { IBudgetCardDB } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-card-image',
  templateUrl: 'budget-card-image.html',
  styleUrls: ['budget-card-image.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BudgetCardImageComponent implements OnInit, OnDestroy {
  @Input() card: IBudgetCardDB;
  imgData: string;
  imgUrl: SafeUrl;
  objUrl: string;
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.card.customMeta) {
      this.imgData = this.card.customMeta.imgData;
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
}
