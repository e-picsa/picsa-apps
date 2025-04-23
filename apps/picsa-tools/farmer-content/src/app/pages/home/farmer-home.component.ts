import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaScrollRestoreDirective } from '@picsa/shared/directives';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MatRippleModule,
    PicsaScrollRestoreDirective,
    PicsaTranslateModule,
    RouterModule,
  ],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
  animations: [FadeInOut()],
})
export class FarmerContentHomeComponent implements AfterViewInit {
  public content = FARMER_CONTENT_DATA;

  public showSkinSelector = false;

  public skinToneOptions = [
    { label: 'Porcelain', color: '#EAC6BB' },
    { label: 'Sand', color: '#F1C27D' },
    { label: 'Golden', color: '#E3B38D' },
    { label: 'Honey', color: '#D8A784' },
    { label: 'Caramel', color: '#C68E56' },
    { label: 'Bronze', color: '#B07D48' },
    { label: 'Almond', color: '#9E6B43' },
    { label: 'Umber', color: '#8D5524' },
    { label: 'Espresso', color: '#6F4E37' },
    { label: 'Cocoa', color: '#5C3836' },
    { label: 'Deep Cocoa', color: '#4C3024' },
    { label: 'Rich Ebony', color: '#3C2A21' },
    { label: 'Deep Ebony', color: '#2C1810' },
  ];

  public selectedSkinColor = this.skinToneOptions[6].color;

  @ViewChildren('stepImageContainer') svgContainers!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    this.injectSvgs();
  }

  onColorChange(): void {
    this.injectSvgs(); // re-render icons with new color
  }

  injectSvgs(): void {
    this.content.forEach((step, index) => {
      const container = this.svgContainers.get(index)?.nativeElement;
      if (!container) return;

      fetch(step.icon_path)
        .then((res) => res.text())
        .then((svgText) => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgEl = svgDoc.documentElement;

          const originalViewBox = svgEl.getAttribute('viewBox');
          const originalWidth = svgEl.getAttribute('width');
          const originalHeight = svgEl.getAttribute('height');

          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');

          if (!originalViewBox) {
            const width = originalWidth || '100';
            const height = originalHeight || '100';
            svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
          }

          svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svgEl.setAttribute('fill', this.selectedSkinColor);

          // svgEl.querySelectorAll('[fill]').forEach(el => {
          //   (el as SVGElement).setAttribute('fill', this.selectedSkinColor || '#000');
          // });

          const brightness = this.getBrightness(this.selectedSkinColor);
          if (brightness > 220) {
            container.style.backgroundColor = '#f1f1f1'; // Very bright tones
          }

          container.style.display = 'flex';
          container.style.justifyContent = 'center';
          container.style.alignItems = 'center';

          svgEl.style.maxWidth = '100%';
          svgEl.style.maxHeight = '100%';
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';

          container.innerHTML = '';
          container.appendChild(svgEl);
        })
        .catch((err) => console.log('Error loading SVG:', err));
    });
  }

  onSelectSkinTone(color: string): void {
    this.selectedSkinColor = color;
    this.injectSvgs(); // update icons
  }

  getBrightness(hex: string): number {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)
      ?.map((c) => parseInt(c, 16));
    if (!rgb) return 0;
    const [r, g, b] = rgb;
    // Standard luminance formula
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}
