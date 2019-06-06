import { Component, Input } from "@angular/core";

@Component({
  selector: "budget-card-image",
  templateUrl: "budget-card-image.html"
})
export class BudgetCardImageComponent {
  @Input("imageId") imageId: string;
  @Input("imageData") imageData: string;
  @Input("type") type: string;
  source: string;

  ngOnInit() {
    this.source = this._selectImageExtension(this.type);
  }

  // svg automatically fallsback to png on error, but optionally
  // png can be put first for specific card types
  _selectImageExtension(cardType: string) {
    if (cardType && defaultExtensions[cardType]) {
      return defaultExtensions[cardType];
    } else {
      return "png";
    }
  }

  svgError() {
    this.source = "png";
  }
  pngError() {
    this.source = "fallback";
  }
}
const defaultExtensions = {
  enterprise: "svg",
  new: "svg"
};
