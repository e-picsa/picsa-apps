import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { getStroke, StrokeOptions } from 'perfect-freehand';

import { generateID } from '../../services/core/db/db.service';

type Segment = {
  /** Unique id for each segment for efficient tracking */
  id: string;
  /** [x,y,pressure] point representation for current segment */
  points: [number, number, number][];
  /** Generate svg path */
  path: WritableSignal<string>;
};

@Component({
  selector: 'picsa-custom-drawing',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDrawingComponent {
  /** Number of pixel difference required to record new point */
  private tolerance = 5;

  /** Perfect-freehand configuration */
  strokeOptions: StrokeOptions = {
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
      taper: 0,
      easing: (t) => t,
      cap: true,
    },
  };

  /** List of segment currently being drawn */
  public activeSegment = this.createNewSegment();

  /** List of all saved segments */
  public segments: Segment[] = [];

  /** List of segments removed pending redo */
  private redoStack: Segment[] = [];

  /**
   * When the svg is rendered in a parent element track position
   * to use to offset
   */
  private containerOffset = [0, 0];

  @ViewChild('svgElement') svgElement: ElementRef<SVGElement>;

  constructor(public dialog: MatDialog) {}

  private createNewSegment() {
    const segment: Segment = { id: generateID(5), path: signal(''), points: [] };
    return segment;
  }

  handlePointerDown(event: PointerEvent) {
    // Set svg element as target for future pointer events (will release automatically on pointerup)
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
    const target = event.target as SVGElement;
    target.setPointerCapture(event.pointerId);

    // Ensure all points are calculated relative to svg container
    this.calculateContainerOffset();

    // ensure previous segment finalised (in case pointerup not fired) and start new segment
    if (this.activeSegment?.points.length > 0) {
      this.finaliseActiveSegment();
    }
    // ensure initial point set on active segment
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerUp() {
    this.finaliseActiveSegment();
  }

  /** Add a point to the current path, adjusting absolute position for relative container */
  private addPointToActiveSegment(x: number, y: number, pressure = 0.5) {
    // calculate svg point position relative to container
    const [left, top] = this.containerOffset;
    const currentX = x - left;
    const currentY = y - top;
    // check whether points differ significantly from previous and render accordingly
    const lastPoint = this.activeSegment.points[this.activeSegment.points.length - 1];
    const [lastX, lastY] = lastPoint || [-1, -1];
    if (Math.abs(lastX - currentX) > this.tolerance || Math.abs(lastY - currentY) > this.tolerance) {
      this.activeSegment.points.push([x - left, y - top, pressure]);
      this.renderActiveSegment();
    }
  }

  /** Determine current positioning of svg drawing container to use for path offsets */
  private calculateContainerOffset() {
    const svgEl = this.svgElement.nativeElement;
    const { left, top } = svgEl.getBoundingClientRect();
    this.containerOffset = [left, top];
  }

  /** Render an svg path element generated from current list of points */
  private renderActiveSegment() {
    const stroke = getStroke(this.activeSegment.points, this.strokeOptions);
    const path = this.getSvgPathFromStroke(stroke);
    this.activeSegment.path.set(path);
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

  /* Clear Draw */
  public clearDraw() {
    this.activeSegment = this.createNewSegment();
    this.segments = [];
  }

  /* Undo previous Stroke render */
  public undoSvgStroke() {
    const lastSegment = this.segments.pop();
    if (lastSegment) {
      this.redoStack.push(lastSegment);
    }
  }

  /* Redo Stroke render */
  public redoSvgStroke() {
    const lastSegment = this.redoStack.pop();
    if (lastSegment) {
      this.segments.push(lastSegment);
    }
  }

  /* End the current stroke */
  public finaliseActiveSegment() {
    if (this.activeSegment.points.length > 0) {
      this.segments.push(this.activeSegment);
      this.activeSegment = this.createNewSegment();
    }
  }
}
