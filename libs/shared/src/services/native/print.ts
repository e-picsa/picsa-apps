import { inject, Injectable } from '@angular/core';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { Capacitor } from '@capacitor/core';
import { _wait } from '@picsa/utils';
import download from 'downloadjs';
import html2canvas from 'html2canvas';

@Injectable({ providedIn: 'root' })
export class PrintProvider {
  private socialSharing = inject(SocialSharing);

  /**
   * Convert HTML content to an image and share
   * @param domSelector html selector of content to share, queried using document.querySelector
   * @param filename name of file to output, `.png` will be added to the end of the name provided
   * @param title optional title to be added to the top of the generated image
   */
  public async shareHtmlDom(domSelector: string, filename: string, title?: string) {
    const domEl = document.querySelector(domSelector) as HTMLElement;
    const clone = domEl.cloneNode(true) as HTMLElement;
    clone.classList.toggle('print-mode');
    // add title
    if (title) {
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      clone.prepend(titleEl);
    }

    // attach clone, generate svg and export
    const body = document.querySelector('body') as HTMLBodyElement;
    body.append(clone);
    // allow taint for rendering svgs, see https://github.com/niklasvh/html2canvas/issues/95
    const canvasElm = await html2canvas(clone, { allowTaint: true });
    // use set timeout to ensure resizing complete
    // TODO - check if required or if better solution could exist
    await _wait(200);
    const base64 = canvasElm.toDataURL();
    body.removeChild(clone);
    return this.shareDataImage(base64, filename);
  }

  async sharePNGImage(pngUri: string, title: string) {
    await this.shareDataImage(pngUri, title);
  }

  /**
   * Generated using Claude 4
   * Take a rendered svg element in html and convert to png. Ensure any inherited css styles
   * are correctly inlined so that the png replicates the svg exactly
   */
  public async svgToPngBlob(
    svgElement: SVGSVGElement,
    options?: { width?: number; height?: number; scale?: number; backgroundColor?: string },
  ): Promise<Blob> {
    const svgRect = svgElement.getBoundingClientRect();
    const width = options?.width || (svgRect.width > 0 ? svgRect.width : 900);
    const height = options?.height || (svgRect.height > 0 ? svgRect.height : 530);
    const scale = options?.scale || 1;
    const backgroundColor = options?.backgroundColor || 'white';

    // Get computed styles and serialize the SVG
    const serializedSvg = serializeSvgWithStyles(svgElement, width, height);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Set canvas dimensions
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Scale context if needed
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    // Set background color if specified
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    }

    // Create image from SVG
    const img = new Image();
    const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<Blob>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // Convert to PNG
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  private async shareDataImage(base64Img: string, title: string) {
    if (Capacitor.isNativePlatform()) {
      return this.socialSharing.share('', title, base64Img);
    } else {
      return download(base64Img, title + '.png', 'image/png');
    }
  }
}

const SVG_STYLE_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'display',
  'visibility',
  'shape-rendering',
  'clip-path',
];

/** Take an svgElement and inline any inherited styles */
function serializeSvgWithStyles(svgElement: SVGElement, width = 900, height = 530) {
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());
  if (!clonedSvg.getAttribute('viewBox')) {
    clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  // Get all elements in the SVG
  const allElements = [clonedSvg, ...clonedSvg.querySelectorAll('*')];

  // Apply computed styles to each element for relevant SVG presentation properties only
  allElements.forEach((element, index) => {
    const originalElement = index === 0 ? svgElement : svgElement.querySelectorAll('*')[index - 1];

    if (originalElement) {
      // If the element is part of custom point overlay or legend overlay, preserve its explicit attributes and styles
      const isCustomOverlay = originalElement.closest('.picsa-point-overlay, .picsa-legend-overlay');
      if (isCustomOverlay) {
        return;
      }

      // If chart overlay is active and element is a standard c3 circle, force opacity 0 and display none
      if (originalElement.classList.contains('c3-circle')) {
        const isOverlayActive = svgElement.querySelector('.picsa-point-overlay') !== null;
        if (isOverlayActive) {
          element.setAttribute('style', 'opacity: 0 !important; display: none !important;');
          return;
        }
      }

      const computedStyle = window.getComputedStyle(originalElement);
      const styleString = SVG_STYLE_PROPERTIES.map((prop) => {
        const val = computedStyle.getPropertyValue(prop);
        return val ? `${prop}: ${val}` : '';
      })
        .filter(Boolean)
        .join('; ');

      if (styleString) {
        element.setAttribute('style', styleString);
      }
    }
  });

  // Serialize the SVG
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Ensure proper SVG namespace
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svgString;
}
