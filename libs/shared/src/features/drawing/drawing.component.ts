import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';
import { getStroke, StrokeOptions } from 'perfect-freehand';

import { generateID } from '../../services/core/db/db.service';

type DrawingTool = 'pen' | 'highlighter' | 'eraser';

type Segment = {
  /** Unique id for each segment for efficient tracking */
  id: string;
  /** [x,y,pressure] point representation for current segment */
  points: [number, number, number][];
  /** Generate svg path */
  path: WritableSignal<string>;
  /** Stroke color snapshotted from toolbar at creation time */
  color: string;
  /** Stroke width snapshotted from toolbar at creation time */
  width: number;
  /** Tool used to draw the segment, used to render highlighter opacity/blend */
  tool: DrawingTool;
};

@Component({
  selector: 'picsa-custom-drawing',
  imports: [MatButtonModule, MatButtonToggleModule, MatDialogModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDrawingComponent {
  dialog = inject(MatDialog);

  /** SVG drawing viewbox and container size */
  size = input(384);

  viewbox = computed(() => `0 0 ${this.size()} ${this.size()}`);

  public onChange = output<string>();

  /** Currently selected tool */
  public tool = signal<DrawingTool>('pen');

  /** Currently selected stroke color (pen/highlighter only) */
  public color = signal('#1a1a1a');

  /** Currently selected stroke width (pen/highlighter only) */
  public strokeWidth = signal(8);

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

  /** Number of pixel difference required to record new point */
  private tolerance = 5;

  /** Number of decimal places svg path calculated to */
  private precision = 2;

  /** Perfect-freehand configuration (size applied per-segment, see renderActiveSegment) */
  private baseStrokeOptions: Omit<StrokeOptions, 'size'> = {
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

  @ViewChild('svgElement') svgElement: ElementRef<SVGElement>;

  handlePointerDown(event: PointerEvent) {
    // Set svg element as target for future pointer events (will release automatically on pointerup)
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
    const target = event.target as SVGElement;
    target.setPointerCapture(event.pointerId);

    if (this.tool() === 'eraser') {
      this.eraseAtPoint(event.clientX, event.clientY);
      return;
    }

    // Ensure all points are calculated relative to svg container
    this.calculateContainerOffset();

    // ensure previous segment finalised (in case pointerup not fired) and start new segment
    this.finaliseActiveSegment();

    // ensure initial point set on active segment
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    if (this.tool() === 'eraser') {
      this.eraseAtPoint(event.clientX, event.clientY);
      return;
    }
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerUp() {
    if (this.tool() !== 'eraser' && this.activeSegment.points.length > 0) {
      this.finaliseActiveSegment();
    }
    // output current full svg
    const data = this.sanitizeOutputSVG();
    this.onChange.emit(data);
  }

  /** Remove any segment rendered under the given point (eraser tool) */
  private eraseAtPoint(clientX: number, clientY: number) {
    const svgEl = this.svgElement.nativeElement;
    const hits = document.elementsFromPoint(clientX, clientY);
    const erasedIds = new Set(
      hits.filter((el): el is SVGPathElement => el instanceof SVGPathElement && svgEl.contains(el)).map((el) => el.id),
    );
    if (erasedIds.size > 0) {
      this.segments = this.segments.filter((segment) => !erasedIds.has(segment.id));
    }
  }

  /** Replace ngcontent, inserted classes and comments from svg */
  private sanitizeOutputSVG() {
    const svgEl = this.svgElement.nativeElement.outerHTML;
    return svgEl
      .replace(/_ngcontent(\S)* /gi, '')
      .replace(/class="[^"]*"/gi, '')
      .replace(/<!--(.*?)-->/gi, '')
      .replace('style="touch-action: none;"', '');
  }

  private createNewSegment() {
    const segment: Segment = {
      id: generateID(5),
      path: signal(''),
      points: [],
      color: this.color(),
      width: this.strokeWidth(),
      tool: this.tool(),
    };
    return segment;
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
    const stroke = getStroke(this.activeSegment.points, { ...this.baseStrokeOptions, size: this.activeSegment.width });
    const path = getSvgPathFromStroke(stroke, this.precision);
    this.activeSegment.path.set(path);
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

const average = (a: number, b: number) => (a + b) / 2;

/**
 * Generate an svg path from array of [x,y] point arrays
 * Copied from https://github.com/steveruizok/perfect-freehand
 * */
function getSvgPathFromStroke(points: number[][], precision = 2, closed = true) {
  const len = points.length;

  if (len < 2) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(precision)},${a[1].toFixed(precision)} Q${b[0].toFixed(precision)},${b[1].toFixed(
    precision,
  )} ${average(b[0], c[0]).toFixed(precision)},${average(b[1], c[1]).toFixed(precision)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(precision)},${average(a[1], b[1]).toFixed(precision)} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}
