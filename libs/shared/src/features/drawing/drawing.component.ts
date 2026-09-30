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

type StrokeTool = 'pen' | 'highlighter';
/** Shapes dragged out from a bounding box, rendered differently per tool */
type BoxTool = 'rectangle' | 'square' | 'circle' | 'triangle' | 'redaction';
const BOX_TOOLS: BoxTool[] = ['rectangle', 'square', 'circle', 'triangle', 'redaction'];
/** Box tools whose drag is locked to a 1:1 aspect ratio */
const SQUARE_ASPECT_TOOLS: BoxTool[] = ['square', 'circle'];
/** Shapes offered in the grouped "Shapes" menu (redaction stays its own standalone tool) */
type MenuShapeTool = 'rectangle' | 'square' | 'circle' | 'triangle' | 'arrow';
const MENU_SHAPE_TOOLS: MenuShapeTool[] = ['rectangle', 'square', 'circle', 'triangle', 'arrow'];
const MENU_SHAPE_LABELS: Record<MenuShapeTool, string> = {
  rectangle: 'Rectangle',
  square: 'Square',
  circle: 'Circle',
  triangle: 'Triangle',
  arrow: 'Arrow',
};
type DrawingTool = StrokeTool | 'eraser' | BoxTool | 'arrow';

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
  tool: StrokeTool;
};

type Rect = { x: number; y: number; width: number; height: number };

type Shape = {
  /** Unique id for each shape for efficient tracking */
  id: string;
  /** Rectangle or redaction, reactive since it grows/shrinks live while dragging */
  rect: WritableSignal<Rect>;
  tool: BoxTool;
  /** Outline color snapshotted from toolbar at creation time (rectangle only) */
  color: string;
  /** Outline width snapshotted from toolbar at creation time (rectangle only) */
  strokeWidth: number;
};

type Line = { x1: number; y1: number; x2: number; y2: number };

type Arrow = {
  /** Unique id for each arrow, also used for its marker (arrowhead) element */
  id: string;
  /** Reactive since it grows live while dragging */
  line: WritableSignal<Line>;
  color: string;
  strokeWidth: number;
};

/** A single undoable action, tracked in creation order across strokes, shapes and arrows */
type HistoryEntry =
  | { kind: 'segment'; item: Segment }
  | { kind: 'shape'; item: Shape }
  | { kind: 'arrow'; item: Arrow };

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

  /** Rectangle/redaction shape currently being dragged out, if any */
  public activeShape: Shape | null = null;

  /** List of all saved shapes */
  public shapes: Shape[] = [];

  /** Corner the current shape drag started from, in canvas-local coordinates */
  private shapeDragOrigin: [number, number] | null = null;

  /** Arrow currently being dragged out, if any */
  public activeArrow: Arrow | null = null;

  /** List of all saved arrows */
  public arrows: Arrow[] = [];

  public readonly menuShapeTools = MENU_SHAPE_TOOLS;
  public readonly menuShapeLabels = MENU_SHAPE_LABELS;
  public shapesActive = computed(() => MENU_SHAPE_TOOLS.includes(this.tool() as MenuShapeTool));

  /** Actions in creation order, across strokes, shapes and arrows, used to drive undo/redo */
  private history: HistoryEntry[] = [];

  /** Actions removed pending redo */
  private redoStack: HistoryEntry[] = [];

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

  /** Pick a shape from the grouped "Shapes" menu and activate it */
  public selectShapeTool(shapeTool: MenuShapeTool) {
    this.tool.set(shapeTool);
  }

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

    if (BOX_TOOLS.includes(this.tool() as BoxTool)) {
      const [left, top] = this.containerOffset;
      const origin: [number, number] = [event.pageX - left, event.pageY - top];
      this.shapeDragOrigin = origin;
      this.activeShape = {
        id: generateID(5),
        tool: this.tool() as BoxTool,
        rect: signal({ x: origin[0], y: origin[1], width: 0, height: 0 }),
        color: this.color(),
        strokeWidth: this.strokeWidth(),
      };
      return;
    }

    if (this.tool() === 'arrow') {
      const [left, top] = this.containerOffset;
      const x = event.pageX - left;
      const y = event.pageY - top;
      this.activeArrow = {
        id: generateID(5),
        line: signal({ x1: x, y1: y, x2: x, y2: y }),
        color: this.color(),
        strokeWidth: this.strokeWidth(),
      };
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
    if (this.activeShape && this.shapeDragOrigin) {
      const [left, top] = this.containerOffset;
      const currentX = event.pageX - left;
      const currentY = event.pageY - top;
      const [startX, startY] = this.shapeDragOrigin;
      this.activeShape.rect.set(boundingRect(startX, startY, currentX, currentY, this.activeShape.tool));
      return;
    }
    if (this.activeArrow) {
      const [left, top] = this.containerOffset;
      const start = this.activeArrow.line();
      this.activeArrow.line.set({ ...start, x2: event.pageX - left, y2: event.pageY - top });
      return;
    }
    this.addPointToActiveSegment(event.pageX, event.pageY);
  }

  handlePointerUp() {
    if (this.activeShape) {
      const rect = this.activeShape.rect();
      // ignore accidental clicks that never dragged out a visible box
      if (rect.width > 2 && rect.height > 2) {
        this.finaliseActiveShape();
      }
      this.activeShape = null;
      this.shapeDragOrigin = null;
    } else if (this.activeArrow) {
      const line = this.activeArrow.line();
      // ignore accidental clicks that never dragged out a visible arrow
      if (Math.hypot(line.x2 - line.x1, line.y2 - line.y1) > 4) {
        this.finaliseActiveArrow();
      }
      this.activeArrow = null;
    } else if (this.tool() !== 'eraser' && this.activeSegment.points.length > 0) {
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
      // only ever called while pen/highlighter is selected (see handlePointerDown/Up)
      tool: this.tool() as StrokeTool,
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
    this.activeShape = null;
    this.shapeDragOrigin = null;
    this.shapes = [];
    this.activeArrow = null;
    this.arrows = [];
    this.history = [];
    this.redoStack = [];
  }

  /* Undo previous action (stroke, shape or arrow) */
  public undoSvgStroke() {
    const last = this.history.pop();
    if (!last) return;
    if (last.kind === 'segment') {
      this.segments = this.segments.filter((segment) => segment !== last.item);
    } else if (last.kind === 'shape') {
      this.shapes = this.shapes.filter((shape) => shape !== last.item);
    } else {
      this.arrows = this.arrows.filter((arrow) => arrow !== last.item);
    }
    this.redoStack.push(last);
  }

  /* Redo previously undone action (stroke, shape or arrow) */
  public redoSvgStroke() {
    const last = this.redoStack.pop();
    if (!last) return;
    if (last.kind === 'segment') {
      this.segments = [...this.segments, last.item];
    } else if (last.kind === 'shape') {
      this.shapes = [...this.shapes, last.item];
    } else {
      this.arrows = [...this.arrows, last.item];
    }
    this.history.push(last);
  }

  /* End the current stroke */
  public finaliseActiveSegment() {
    if (this.activeSegment.points.length > 0) {
      this.segments.push(this.activeSegment);
      this.history.push({ kind: 'segment', item: this.activeSegment });
    }
  }

  /* End the current shape drag */
  public finaliseActiveShape() {
    if (this.activeShape) {
      this.shapes.push(this.activeShape);
      this.history.push({ kind: 'shape', item: this.activeShape });
    }
  }

  /** Saved shapes plus the one currently being dragged out, for a single render pass */
  public displayShapes(): Shape[] {
    return this.activeShape ? [...this.shapes, this.activeShape] : this.shapes;
  }

  /** Triangle outline inscribed in a bounding rect: apex top-center, base spanning the bottom */
  public trianglePoints(rect: Rect): string {
    const { x, y, width, height } = rect;
    return `${x + width / 2},${y} ${x},${y + height} ${x + width},${y + height}`;
  }

  /* End the current arrow drag */
  public finaliseActiveArrow() {
    if (this.activeArrow) {
      this.arrows.push(this.activeArrow);
      this.history.push({ kind: 'arrow', item: this.activeArrow });
    }
  }
}

/**
 * Build a bounding rect from a drag's start/current point, keeping the start corner fixed.
 * Square/circle tools are locked to a 1:1 aspect ratio, growing from the same start corner.
 */
function boundingRect(startX: number, startY: number, currentX: number, currentY: number, tool: BoxTool): Rect {
  if (SQUARE_ASPECT_TOOLS.includes(tool)) {
    const size = Math.max(Math.abs(currentX - startX), Math.abs(currentY - startY));
    return {
      x: currentX < startX ? startX - size : startX,
      y: currentY < startY ? startY - size : startY,
      width: size,
      height: size,
    };
  }
  return {
    x: Math.min(startX, currentX),
    y: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY),
  };
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
