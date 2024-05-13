import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { getStroke } from 'perfect-freehand';

@Component({
  selector: 'picsa-custom-drawing',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class PicsaDrawingComponent {
  options = {
    size: 32,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => t,
    start: {
      taper: 0,
      easing: (t) => t,
      cap: true,
    },
    end: {
      taper: 100,
      easing: (t) => t,
      cap: true,
    },
  };
  /** [x,y,pressure] point representation */
  public points: [number, number, number][] = [];

  /** SVG representation of active path segment */
  public pathData = signal<string>('');

  /**
   * When the svg is rendered in a parent element track position
   * to use to offset
   */
  private containerOffset = [0, 0];

  @ViewChild('svgElement') svgElement: ElementRef<SVGElement>;

  constructor(public dialog: MatDialog) {}

  handlePointerDown(event: PointerEvent) {
    const target = event.target as SVGElement;
    target.setPointerCapture(event.pointerId);
    this.calculateContainerOffset();
    this.addPointToPath(event.pageX, event.pageY);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    this.addPointToPath(event.pageX, event.pageY);
  }

  private addPointToPath(x: number, y: number, pressure = 0.5) {
    const [left, top] = this.containerOffset;
    this.points.push([x - left, y - top, pressure]);
    const stroke = getStroke(this.points);
    const svgPath = this.getSvgPathFromStroke(stroke);
    this.pathData.set(svgPath);
  }

  private calculateContainerOffset() {
    const svgEl = this.svgElement.nativeElement;
    const { left, top } = svgEl.getBoundingClientRect();
    this.containerOffset = [left, top];
  }

  /**
   * Generate an svg path from array of [x,y] point arrays
   * Copied from https://github.com/steveruizok/perfect-freehand
   * */
  private getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke.length) return '';
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ['M', ...stroke[0], 'Q']
    );
    d.push('Z');
    return d.join(' ');
  }
}
