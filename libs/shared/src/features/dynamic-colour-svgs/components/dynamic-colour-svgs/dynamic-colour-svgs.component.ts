import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { SkinToneService } from '../../dynamic-colour-svg.service';

@Component({
  standalone: true,
  selector: 'picsa-dynamic-colour-svgs',
  imports: [CommonModule],
  templateUrl: './dynamic-colour-svgs.component.html',
  styleUrls: ['./dynamic-colour-svgs.component.scss'],
})
export class DynamicColourSvgsComponent implements AfterViewInit, OnDestroy {
  @Input() svgUrl!: string;
  public colour: string;

  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef;

  private skinToneSubscription: Subscription;

  constructor(private skinToneService: SkinToneService) {
    this.colour = this.skinToneService.getCurrentSkinTone();
  }

  ngAfterViewInit(): void {
    // Subscribe to skin tone changes
    this.skinToneSubscription = this.skinToneService.skinTone$.subscribe((color) => {
      this.colour = color;
      this.injectSvg();
    });

    this.injectSvg();
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.skinToneSubscription) {
      this.skinToneSubscription.unsubscribe();
    }
  }

  ngOnChanges(): void {
    this.injectSvg();
  }

  injectSvg(): void {
    const container = this.svgContainer?.nativeElement;
    if (!container || !this.svgUrl) return;

    fetch(this.svgUrl)
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
        svgEl.setAttribute('fill', this.colour);

        const brightness = this.getBrightness(this.colour);
        if (brightness > 220) {
          container.style.backgroundColor = '#ffffff';
        } else if (brightness > 180) {
          container.style.backgroundColor = '#f0f0f0';
        } else {
          container.style.backgroundColor = '#e0e0e0';
        }

        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';

        svgEl.style.width = '100%';
        svgEl.style.height = '100%';

        container.innerHTML = '';
        container.appendChild(svgEl);
      })
      .catch((err) => console.error('Error loading SVG:', err));
  }

  getBrightness(hex: string): number {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)
      ?.map((c) => parseInt(c, 16));
    if (!rgb) return 0;
    const [r, g, b] = rgb;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}
