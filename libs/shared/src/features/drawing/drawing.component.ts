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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PicsaTranslateModule } from '@picsa/i18n';
import { getStroke, StrokeOptions } from 'perfect-freehand';

import { generateID } from '../../services/core/db/db.service';

type DrawingTool = 'pen' | 'highlighter' | 'eraser';

/** Preset colors shown in the toolbar swatch grid */
const COLOR_SWATCHES = [
  '#1a1a1a',
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#ffffff',
  '#9e9e9e',
  '#26c6da',
  '#1e88e5',
  '#8e24aa',
  '#d81b60',
];

/** Preset stroke widths shown in the toolbar width menu */
const WIDTH_PRESETS = [4, 12, 24];

/** Eraser-shaped cursor shown over the canvas while the eraser tool is active */
const ERASER_CURSOR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='28' height='28'>
  <g transform='rotate(45 12 12)'>
    <rect x='4' y='8' width='16' height='9' rx='2' fill='white' fill-opacity='0.95' stroke='black' stroke-width='1.6' />
    <line x1='4' y1='13' x2='20' y2='13' stroke='black' stroke-width='1.6' />
  </g>
  <line x1='15' y1='21' x2='21' y2='21' stroke='black' stroke-width='1.6' stroke-linecap='round' />
</svg>`;
const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(ERASER_CURSOR_SVG)}") 5 20, auto`;

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
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    PicsaTranslateModule,
  ],
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

  /** Preset colors and widths rendered in the toolbar */
  public readonly colorSwatches = COLOR_SWATCHES;
  public readonly widthPresets = WIDTH_PRESETS;

  /** Erase hit-radius, floored so it stays usable at small widths */
  public eraserRadius = computed(() => Math.max(this.strokeWidth() / 2, 6));

  /** Canvas cursor for the currently selected tool */
  public canvasCursor = computed(() => (this.tool() === 'eraser' ? ERASER_CURSOR : 'auto'));

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

    // Ensure all points are calculated relative to svg container
    this.calculateContainerOffset();

    if (this.tool() === 'eraser') {
      this.eraseAtPoint(event.pageX, event.pageY);
      return;
    }

    // ensure previous segment finalised (in case pointerup not fired) and start a new segment
    // with the currently selected tool/color/width (activeSegment may otherwise hold a stale style
    // snapshot from before the last tool change)
    this.finaliseActiveSegment();
    this.activeSegment = this.createNewSegment();

    // ensure initial point set on active segment
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    if (this.tool() === 'eraser') {
      this.eraseAtPoint(event.pageX, event.pageY);
      return;
    }
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerUp() {
    if (this.tool() !== 'eraser' && this.activeSegment.points.length > 0) {
      this.finaliseActiveSegment();
      this.activeSegment = this.createNewSegment();
    }
    // output current full svg
    const data = this.sanitizeOutputSVG();
    this.onChange.emit(data);
  }

  /**
   * Remove points within the eraser radius of the given point, splitting segments where
   * points are removed from the middle rather than deleting the whole stroke
   */
  private eraseAtPoint(x: number, y: number) {
    const [left, top] = this.containerOffset;
    const cx = x - left;
    const cy = y - top;
    const radius = this.eraserRadius();

    let didErase = false;
    const nextSegments: Segment[] = [];
    for (const segment of this.segments) {
      const runs = splitPointsAroundCircle(segment.points, cx, cy, radius);
      if (runs === null) {
        nextSegments.push(segment);
        continue;
      }
      didErase = true;
      for (const points of runs) {
        if (points.length > 1) {
          nextSegments.push(this.createSegmentFromPoints(points, segment));
        }
      }
    }
    if (didErase) {
      this.segments = nextSegments;
    }
  }

  /** Build a new segment from a point list, inheriting style from an existing segment */
  private createSegmentFromPoints(
    points: [number, number, number][],
    style: Pick<Segment, 'color' | 'width' | 'tool'>,
  ) {
    // Pick only the style fields explicitly: callers pass the full original segment here, and
    // spreading it would silently overwrite the fresh id/path/points below with the old ones
    const segment: Segment = {
      id: generateID(5),
      path: signal(''),
      points,
      color: style.color,
      width: style.width,
      tool: style.tool,
    };
    const stroke = getStroke(segment.points, { ...this.baseStrokeOptions, size: segment.width });
    segment.path.set(getSvgPathFromStroke(stroke, this.precision));
    return segment;
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
    }
  }
}

/** Squared distance from a point to the closest point on a line segment */
function distanceToSegmentSquared(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return (px - closestX) ** 2 + (py - closestY) ** 2;
}

/**
 * Remove points falling within a circle from a point list, splitting the remainder into
 * separate contiguous runs wherever points were removed from the middle. A point is erased
 * if it, or either line segment connecting it to a neighbour, comes within the circle -
 * this avoids gaps being missed when sampled points are spaced further apart than the radius.
 * Returns null if no points were within the circle (segment left untouched).
 */
function splitPointsAroundCircle(
  points: [number, number, number][],
  cx: number,
  cy: number,
  radius: number,
): [number, number, number][][] | null {
  const radiusSq = radius ** 2;
  const erased = points.map(([x, y]) => (x - cx) ** 2 + (y - cy) ** 2 <= radiusSq);

  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    if (distanceToSegmentSquared(cx, cy, x1, y1, x2, y2) <= radiusSq) {
      erased[i] = true;
      erased[i + 1] = true;
    }
  }

  if (!erased.some(Boolean)) {
    return null;
  }

  const runs: [number, number, number][][] = [];
  let current: [number, number, number][] = [];
  points.forEach((point, i) => {
    if (erased[i]) {
      if (current.length > 0) {
        runs.push(current);
        current = [];
      }
    } else {
      current.push(point);
    }
  });
  if (current.length > 0) {
    runs.push(current);
  }

  return runs;
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
