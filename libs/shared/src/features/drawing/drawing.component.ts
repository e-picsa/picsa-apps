import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
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
import { base64ToBlob, loadImage, parseDataUri } from '../../services/core/feedback/image.utils';

type StrokeTool = 'pen' | 'highlighter';
type BoxTool = 'rectangle' | 'square' | 'circle' | 'triangle' | 'redaction';
const BOX_TOOLS: BoxTool[] = ['rectangle', 'square', 'circle', 'triangle', 'redaction'];
const SQUARE_ASPECT_TOOLS: BoxTool[] = ['square', 'circle'];
type LineTool = 'line' | 'arrow';
const LINE_TOOLS: LineTool[] = ['line', 'arrow'];
type MenuShapeTool = 'rectangle' | 'square' | 'circle' | 'triangle' | LineTool;
const MENU_SHAPE_TOOLS: MenuShapeTool[] = ['rectangle', 'square', 'circle', 'triangle', 'line', 'arrow'];
const MENU_SHAPE_LABELS: Record<MenuShapeTool, string> = {
  rectangle: 'Rectangle',
  square: 'Square',
  circle: 'Circle',
  triangle: 'Triangle',
  line: 'Line',
  arrow: 'Arrow',
};
type DrawingTool = StrokeTool | 'eraser' | BoxTool | LineTool | 'text';

type MainTool = 'pen' | 'highlighter' | 'eraser' | 'redaction' | 'text';
const MAIN_TOOLS: MainTool[] = ['pen', 'highlighter', 'eraser', 'redaction', 'text'];
const MAIN_TOOL_LABELS: Record<MainTool, string> = {
  pen: 'Pen',
  highlighter: 'Highlighter',
  eraser: 'Eraser',
  redaction: 'Redact',
  text: 'Text',
};
const MAIN_TOOL_ICONS: Record<MainTool, string> = {
  pen: 'draw',
  highlighter: 'border_color',
  eraser: 'auto_fix_high',
  redaction: 'visibility_off',
  text: 'text_fields',
};
const MENU_SHAPE_ICONS: Record<MenuShapeTool, string> = {
  rectangle: 'crop_din',
  square: 'square',
  circle: 'panorama_fish_eye',
  triangle: 'change_history',
  line: 'horizontal_rule',
  arrow: 'arrow_right_alt',
};

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

const WIDTH_PRESETS = [2, 6, 14];
const DEFAULT_STROKE_WIDTH = 6;
const DEFAULT_TEXT_FONT_SIZE = 24;
const MIN_TEXT_FONT_SIZE = 8;
const MAX_TEXT_FONT_SIZE = 120;

const ERASER_CURSOR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='28' height='28'>
  <g transform='rotate(45 12 12)'>
    <rect x='4' y='8' width='16' height='9' rx='2' fill='white' fill-opacity='0.95' stroke='black' stroke-width='1.6' />
    <line x1='4' y1='13' x2='20' y2='13' stroke='black' stroke-width='1.6' />
  </g>
  <line x1='15' y1='21' x2='21' y2='21' stroke='black' stroke-width='1.6' stroke-linecap='round' />
</svg>`;
const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(ERASER_CURSOR_SVG)}") 5 20, auto`;

const TOOL_CURSORS: Partial<Record<DrawingTool, string>> = {
  pen: 'crosshair',
  highlighter: 'crosshair',
  rectangle: 'crosshair',
  square: 'crosshair',
  circle: 'crosshair',
  triangle: 'crosshair',
  redaction: 'crosshair',
  line: 'crosshair',
  arrow: 'crosshair',
  text: 'text',
};

type Segment = {
  id: string;
  points: [number, number, number][];
  path: WritableSignal<string>;
  color: string;
  width: number;
  tool: StrokeTool;
};

type Rect = { x: number; y: number; width: number; height: number };

type RedactStyle = 'blackout' | 'blur';

type Shape = {
  id: string;
  rect: WritableSignal<Rect>;
  tool: BoxTool;
  color: string;
  strokeWidth: number;
  redactStyle?: RedactStyle;
};

type Line = { x1: number; y1: number; x2: number; y2: number };

type Arrow = {
  id: string;
  tool: LineTool;
  line: WritableSignal<Line>;
  color: string;
  strokeWidth: number;
};

type TextAnnotation = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
};

/** A highlight over a run of words (inclusive word indices) in one text annotation */
type TextHighlight = { id: string; textId: string; from: number; to: number; color: string };

type WordBox = { index: number; line: number; x: number; y: number; width: number; height: number };

type HistoryEntry =
  | { kind: 'segment'; item: Segment }
  | { kind: 'shape'; item: Shape }
  | { kind: 'arrow'; item: Arrow }
  | { kind: 'text'; item: TextAnnotation }
  | { kind: 'highlight'; item: TextHighlight };

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

  size = input(384);
  backgroundImage = input<string | Blob | null>(null);

  public backgroundImageSrc = signal<string | null>(null);
  private naturalImageSize = signal<{ width: number; height: number } | null>(null);

  public canvasSize = computed(() => {
    const natural = this.naturalImageSize();
    if (!natural) return { width: this.size(), height: this.size() };
    const scale = Math.min(this.size() / natural.width, this.size() / natural.height);
    return { width: Math.round(natural.width * scale), height: Math.round(natural.height * scale) };
  });
  public canvasWidth = computed(() => this.canvasSize().width);
  public canvasHeight = computed(() => this.canvasSize().height);

  viewbox = computed(() => `0 0 ${this.canvasWidth()} ${this.canvasHeight()}`);

  /** Only affects exportImage() - onChange always emits the live SVG string, regardless of this */
  outputFormat = input<'svg' | 'png' | 'jpeg'>('svg');

  public onChange = output<string>();

  public tool = signal<DrawingTool>('pen');
  public color = signal('#1a1a1a');
  public strokeWidth = signal(DEFAULT_STROKE_WIDTH);
  public redactStyle = signal<RedactStyle>('blackout');

  /** Unique per component instance so filter/clip ids don't collide if two drawings are on screen */
  public readonly uid = `d${generateID(5)}`;

  /** Each tool remembers its own thickness; the highlighter starts at the thickest preset */
  private toolWidths: Partial<Record<DrawingTool, number>> = {
    highlighter: WIDTH_PRESETS[WIDTH_PRESETS.length - 1],
  };

  public readonly colorSwatches = COLOR_SWATCHES;
  public readonly widthPresets = WIDTH_PRESETS;

  public nextTextFontSize = signal(DEFAULT_TEXT_FONT_SIZE);
  public eraserRadius = computed(() => Math.max(this.strokeWidth() / 2, 6));

  public canvasCursor = computed(() =>
    this.tool() === 'eraser' ? ERASER_CURSOR : (TOOL_CURSORS[this.tool()] ?? 'auto'),
  );

  public selectedItemId = signal<string | null>(null);

  public activeSegment = this.createNewSegment();
  public activeShape: Shape | null = null;
  private shapeDragOrigin: [number, number] | null = null;
  private shapeEditOrigin: {
    shape: Shape;
    mode: 'move' | 'resize';
    startRect: Rect;
    pointerX: number;
    pointerY: number;
  } | null = null;

  public activeArrow: Arrow | null = null;
  private arrowEditOrigin: {
    arrow: Arrow;
    mode: 'move' | 'start' | 'end';
    startLine: Line;
    pointerX: number;
    pointerY: number;
  } | null = null;

  public activeHighlight: TextHighlight | null = null;

  private textEditOrigin: {
    text: TextAnnotation;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    startFontSize: number;
    pointerX: number;
    pointerY: number;
    /** Set once the drag crosses the tap tolerance; released while still false counts as a tap */
    moved: boolean;
  } | null = null;

  public readonly menuShapeTools = MENU_SHAPE_TOOLS;
  public readonly menuShapeLabels = MENU_SHAPE_LABELS;
  public readonly menuShapeIcons = MENU_SHAPE_ICONS;
  public shapesActive = computed(() => MENU_SHAPE_TOOLS.includes(this.tool() as MenuShapeTool));

  public readonly mainTools = MAIN_TOOLS;
  public readonly mainToolLabels = MAIN_TOOL_LABELS;
  public readonly mainToolIcons = MAIN_TOOL_ICONS;

  public textDraft: {
    x: number;
    y: number;
    value: string;
    editingId: string | null;
    color: string;
    fontSize: number;
  } | null = null;

  public items: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  private containerOffset = [0, 0];
  private tolerance = 5;
  private precision = 2;

  private baseStrokeOptions: Omit<StrokeOptions, 'size'> = {
    thinning: 0,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => t,
    start: { taper: 0, easing: (t) => t, cap: true },
    end: { taper: 0, easing: (t) => t, cap: true },
  };

  @ViewChild('svgElement') svgElement: ElementRef<SVGElement>;

  constructor() {
    // Blobs are converted to data URLs (not object URLs) so the resolved src stays valid for as
    // long as the saved SVG itself does, instead of breaking once an object URL is revoked
    effect((onCleanup) => {
      const bg = this.backgroundImage();
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      if (!bg) {
        this.backgroundImageSrc.set(null);
        this.naturalImageSize.set(null);
        return;
      }
      resolveImageSrc(bg).then((src) => {
        if (cancelled) return;
        this.backgroundImageSrc.set(src);
        loadImage(src).then((img) => {
          if (!cancelled) this.naturalImageSize.set({ width: img.naturalWidth, height: img.naturalHeight });
        });
      });
    });
  }

  /**
   * Active selection overlay details for blue nodes. A plain method (not computed()) like
   * displayItems()/arrowMarkers() below - it needs to reflect the current `items` state on every
   * render, and `items` is a plain array, not a signal, so a computed() wouldn't know to
   * recompute when it changes (e.g. editing the already-selected text leaves selectedItemId at
   * the same value, which a computed() would treat as "nothing changed" and skip recomputing).
   */
  public selectedItemOverlay():
    | { kind: 'shape'; bounds: Rect; item: Shape }
    | { kind: 'arrow'; line: Line; item: Arrow }
    | { kind: 'text'; bounds: Rect; item: TextAnnotation }
    | null {
    // while a text box is open, the textarea's own border shows what's being edited - the real
    // <text> element is hidden (see displayItems()) so getBBox() can't measure it, which would
    // otherwise leave this falling back to the rough estimateTextBoxSize() guess
    if (this.textDraft) return null;

    const id = this.selectedItemId();
    if (!id) return null;
    const entry = this.items.find((e) => e.item.id === id);
    if (!entry) return null;

    if (entry.kind === 'shape') {
      const rect = entry.item.rect();
      return { kind: 'shape', bounds: rect, item: entry.item };
    }
    if (entry.kind === 'arrow') {
      const line = entry.item.line();
      return { kind: 'arrow', line, item: entry.item };
    }
    if (entry.kind === 'text') {
      const el = this.svgElement?.nativeElement?.querySelector(`#${CSS.escape(entry.item.id)}`);
      let { width, height } = estimateTextBoxSize(entry.item.text, entry.item.fontSize);
      if (el instanceof SVGTextElement) {
        const box = el.getBBox();
        width = box.width;
        height = box.height;
      }
      return {
        kind: 'text',
        bounds: { x: entry.item.x, y: entry.item.y, width, height },
        item: entry.item,
      };
    }
    return null;
  }

  public selectTool(newTool: DrawingTool) {
    this.toolWidths[this.tool()] = this.strokeWidth();
    this.tool.set(newTool);
    this.strokeWidth.set(this.toolWidths[newTool] ?? DEFAULT_STROKE_WIDTH);
    this.selectedItemId.set(null);
  }

  public selectShapeTool(shapeTool: MenuShapeTool) {
    this.selectTool(shapeTool);
  }

  public adjustFontSize(delta: number) {
    const nextSize = Math.max(MIN_TEXT_FONT_SIZE, Math.min(MAX_TEXT_FONT_SIZE, this.nextTextFontSize() + delta));
    this.setTextFontSize(nextSize);
  }

  public onFontSizeInputChange(val: string | number) {
    const num = Number(val);
    if (!isNaN(num) && num >= MIN_TEXT_FONT_SIZE && num <= MAX_TEXT_FONT_SIZE) {
      this.setTextFontSize(num);
    }
  }

  public setTextFontSize(size: number) {
    this.nextTextFontSize.set(size);
    if (this.textDraft) {
      this.textDraft.fontSize = size;
    }
    const selectedId = this.selectedItemId();
    if (selectedId) {
      const entry = this.items.find((e) => e.item.id === selectedId);
      if (entry && entry.kind === 'text') {
        entry.item.fontSize = size;
        this.onChange.emit(this.sanitizeOutputSVG());
      }
    }
  }

  handlePointerDown(event: PointerEvent) {
    // pointerdown fires before the textarea's blur, so commit here - otherwise a fresh draft
    // would replace the one still being edited before blur gets a chance to save it
    if (this.textDraft) {
      this.commitTextEdit(this.textDraft.value);
      return;
    }

    // Capture on the <svg> itself, not whatever child was hit (a <tspan>, a path...) - the eraser
    // can remove/replace that element mid-drag, which would otherwise drop the pointer capture
    this.svgElement.nativeElement.setPointerCapture(event.pointerId);
    this.calculateContainerOffset();

    const [left, top] = this.containerOffset;
    const x = event.clientX - left;
    const y = event.clientY - top;
    const tool = this.tool();

    if (tool === 'eraser') {
      this.selectedItemId.set(null);
      this.eraseAtPoint(event.clientX, event.clientY);
      return;
    }

    // Only grab an existing item with the tool that made it, so e.g. the pen always draws rather
    // than being intercepted by text/shapes/arrows sitting underneath the stroke.

    if (tool === 'text') {
      const existingText = this.findTextAtPoint(x, y);
      if (existingText) {
        this.selectedItemId.set(existingText.text.id);
        this.nextTextFontSize.set(existingText.text.fontSize);
        this.textEditOrigin = {
          text: existingText.text,
          mode: existingText.mode,
          startX: existingText.text.x,
          startY: existingText.text.y,
          startFontSize: existingText.text.fontSize,
          pointerX: x,
          pointerY: y,
          moved: false,
        };
        return;
      }
    }

    if (BOX_TOOLS.includes(tool as BoxTool)) {
      const existingShape = this.findAnyShapeAtPoint(x, y);
      if (existingShape) {
        this.selectedItemId.set(existingShape.shape.id);
        this.shapeEditOrigin = { ...existingShape, startRect: existingShape.shape.rect(), pointerX: x, pointerY: y };
        return;
      }
    }

    if (LINE_TOOLS.includes(tool as LineTool)) {
      const existingArrow = this.findAnyArrowAtPoint(x, y);
      if (existingArrow) {
        this.selectedItemId.set(existingArrow.arrow.id);
        this.arrowEditOrigin = { ...existingArrow, startLine: existingArrow.arrow.line(), pointerX: x, pointerY: y };
        return;
      }
    }

    this.selectedItemId.set(null);

    // Highlighter pressed on a word -> word highlight instead of a freehand stroke
    if (tool === 'highlighter') {
      const hit = this.findWordAtPoint(x, y);
      if (hit) {
        this.activeHighlight = {
          id: generateID(5),
          textId: hit.text.id,
          from: hit.index,
          to: hit.index,
          color: this.color(),
        };
        return;
      }
    }

    if (BOX_TOOLS.includes(tool as BoxTool)) {
      this.shapeDragOrigin = [x, y];
      this.activeShape = {
        id: generateID(5),
        tool: tool as BoxTool,
        rect: signal({ x, y, width: 0, height: 0 }),
        color: this.color(),
        strokeWidth: this.strokeWidth(),
        redactStyle: tool === 'redaction' ? this.redactStyle() : undefined,
      };
      return;
    }

    if (LINE_TOOLS.includes(tool as LineTool)) {
      this.activeArrow = {
        id: generateID(5),
        tool: tool as LineTool,
        line: signal({ x1: x, y1: y, x2: x, y2: y }),
        color: this.color(),
        strokeWidth: this.strokeWidth(),
      };
      return;
    }

    if (tool === 'text') {
      this.textDraft = { x, y, value: '', editingId: null, color: this.color(), fontSize: this.nextTextFontSize() };
      return;
    }

    this.finaliseActiveSegment();
    this.activeSegment = this.createNewSegment();
    this.addPointToActiveSegment(event.clientX, event.clientY);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    if (this.tool() === 'eraser') {
      this.eraseAtPoint(event.clientX, event.clientY);
      return;
    }

    const [left, top] = this.containerOffset;
    const x = event.clientX - left;
    const y = event.clientY - top;

    if (this.activeHighlight) {
      const text = this.findText(this.activeHighlight.textId);
      if (text) this.activeHighlight.to = this.nearestWordIndex(text, x, y);
      return;
    }

    if (this.activeShape && this.shapeDragOrigin) {
      const [startX, startY] = this.shapeDragOrigin;
      this.activeShape.rect.set(boundingRect(startX, startY, x, y, this.activeShape.tool));
      return;
    }

    if (this.activeArrow) {
      const start = this.activeArrow.line();
      this.activeArrow.line.set({ ...start, x2: x, y2: y });
      return;
    }

    if (this.shapeEditOrigin) {
      const { shape, mode, startRect } = this.shapeEditOrigin;
      const dx = x - this.shapeEditOrigin.pointerX;
      const dy = y - this.shapeEditOrigin.pointerY;
      if (mode === 'move') {
        shape.rect.set({ ...startRect, x: startRect.x + dx, y: startRect.y + dy });
      } else {
        const width = Math.max(10, startRect.width + dx);
        const height = Math.max(10, startRect.height + dy);
        const size = SQUARE_ASPECT_TOOLS.includes(shape.tool) ? Math.max(width, height) : null;
        shape.rect.set({ x: startRect.x, y: startRect.y, width: size ?? width, height: size ?? height });
      }
      return;
    }

    if (this.arrowEditOrigin) {
      const { arrow, mode, startLine } = this.arrowEditOrigin;
      const dx = x - this.arrowEditOrigin.pointerX;
      const dy = y - this.arrowEditOrigin.pointerY;
      if (mode === 'move') {
        arrow.line.set({ x1: startLine.x1 + dx, y1: startLine.y1 + dy, x2: startLine.x2 + dx, y2: startLine.y2 + dy });
      } else if (mode === 'start') {
        arrow.line.set({ ...startLine, x1: startLine.x1 + dx, y1: startLine.y1 + dy });
      } else {
        arrow.line.set({ ...startLine, x2: startLine.x2 + dx, y2: startLine.y2 + dy });
      }
      return;
    }

    if (this.textEditOrigin) {
      const { text, mode, startX, startY, startFontSize } = this.textEditOrigin;
      const dx = x - this.textEditOrigin.pointerX;
      const dy = y - this.textEditOrigin.pointerY;
      if (!this.textEditOrigin.moved && Math.hypot(dx, dy) >= 3) {
        this.textEditOrigin.moved = true;
      }
      if (mode === 'move') {
        text.x = startX + dx;
        text.y = startY + dy;
      } else {
        const newSize = Math.max(
          MIN_TEXT_FONT_SIZE,
          Math.min(MAX_TEXT_FONT_SIZE, Math.round(startFontSize + dx * 0.4)),
        );
        text.fontSize = newSize;
        this.nextTextFontSize.set(newSize);
      }
      return;
    }

    if (this.tool() === 'text') return;
    this.addPointToActiveSegment(event.clientX, event.clientY);
  }

  handlePointerUp() {
    if (this.activeShape) {
      const rect = this.activeShape.rect();
      if (rect.width > 2 && rect.height > 2) {
        this.finaliseActiveShape();
        this.selectedItemId.set(this.activeShape.id);
      }
      this.activeShape = null;
      this.shapeDragOrigin = null;
    } else if (this.activeHighlight) {
      const h = this.activeHighlight;
      const isTap = h.from === h.to;
      const covering = isTap
        ? this.items.filter(
            (e) =>
              e.kind === 'highlight' &&
              e.item.textId === h.textId &&
              h.from >= Math.min(e.item.from, e.item.to) &&
              h.from <= Math.max(e.item.from, e.item.to),
          )
        : [];
      if (covering.length > 0) {
        // tapping an already highlighted word removes that highlight
        this.items = this.items.filter((e) => !covering.includes(e));
      } else {
        this.items.push({ kind: 'highlight', item: h });
      }
      this.activeHighlight = null;
    } else if (this.activeArrow) {
      const line = this.activeArrow.line();
      if (Math.hypot(line.x2 - line.x1, line.y2 - line.y1) > 4) {
        this.finaliseActiveArrow();
        this.selectedItemId.set(this.activeArrow.id);
      }
      this.activeArrow = null;
    } else if (this.textEditOrigin) {
      // released without crossing the move threshold -> treat as a tap, open it for editing
      if (!this.textEditOrigin.moved && this.textEditOrigin.mode === 'move') {
        const text = this.textEditOrigin.text;
        this.textDraft = {
          x: text.x,
          y: text.y,
          value: text.text,
          editingId: text.id,
          color: text.color,
          fontSize: text.fontSize,
        };
      }
      // if it moved (or was a resize), the change was already applied live in handlePointerMove
      this.textEditOrigin = null;
    } else {
      this.shapeEditOrigin = null;
      this.arrowEditOrigin = null;
      this.textEditOrigin = null;

      if (this.tool() !== 'eraser' && this.activeSegment.points.length > 0) {
        this.finaliseActiveSegment();
        this.activeSegment = this.createNewSegment();
      }
    }

    const data = this.sanitizeOutputSVG();
    this.onChange.emit(data);
  }

  private eraseAtPoint(x: number, y: number) {
    const [left, top] = this.containerOffset;
    const cx = x - left;
    const cy = y - top;
    const radius = this.eraserRadius();

    let didErase = false;
    const nextItems: HistoryEntry[] = [];
    for (const entry of this.items) {
      if (entry.kind !== 'segment') {
        nextItems.push(entry);
        continue;
      }
      const runs = splitPointsAroundCircle(entry.item.points, cx, cy, radius);
      if (runs === null) {
        nextItems.push(entry);
        continue;
      }
      didErase = true;
      for (const points of runs) {
        if (points.length > 1) {
          nextItems.push({ kind: 'segment', item: this.createSegmentFromPoints(points, entry.item) });
        }
      }
    }
    if (didErase) {
      this.items = nextItems;
    }
  }

  private createSegmentFromPoints(
    points: [number, number, number][],
    style: Pick<Segment, 'color' | 'width' | 'tool'>,
  ) {
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

  private sanitizeOutputSVG() {
    // backgroundImage is a live tracing aid only - never baked into the saved/exported output
    const clone = this.svgElement.nativeElement.cloneNode(true) as SVGElement;
    clone.querySelector('image')?.remove();
    const svgEl = clone.outerHTML;
    return (
      svgEl
        // matches the full _ngcontent-xxx="..." attribute (including its quotes) rather than any
        // run of non-whitespace chars - the old pattern could run straight through a `>` into the
        // next tag's name whenever _ngcontent was the last/only attribute before it (e.g. <defs>
        // immediately followed by <filter>), corrupting the markup
        .replace(/\s*_ngcontent-[\w-]+="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/<!--(.*?)-->/gi, '')
        .replace('style="touch-action: none;"', '')
    );
  }

  /**
   * Flattens the drawing to outputFormat(). Call this on demand (e.g. a host's "Save" button) -
   * not wired to onChange, since rasterizing on every stroke would be wasted work mid-edit.
   */
  public async exportImage(): Promise<{ base64: string; type: string; blob: Blob }> {
    const svg = this.sanitizeOutputSVG();
    const format = this.outputFormat();
    if (format === 'svg') {
      return { base64: toBase64(svg), type: 'image/svg+xml', blob: new Blob([svg], { type: 'image/svg+xml' }) };
    }

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const img = await loadImage(`data:image/svg+xml;base64,${toBase64(svg)}`);
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth();
    canvas.height = this.canvasHeight();
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    if (mime === 'image/jpeg') {
      // jpeg has no alpha channel - without this, transparent areas would turn black
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const parsed = parseDataUri(canvas.toDataURL(mime));
    if (!parsed) throw new Error('Failed to encode image');
    return { base64: parsed.base64, type: parsed.type, blob: base64ToBlob(parsed.base64, parsed.type) };
  }

  private createNewSegment() {
    const segment: Segment = {
      id: generateID(5),
      path: signal(''),
      points: [],
      color: this.color(),
      width: this.strokeWidth(),
      tool: this.tool() as StrokeTool,
    };
    return segment;
  }

  private addPointToActiveSegment(x: number, y: number, pressure = 0.5) {
    const [left, top] = this.containerOffset;
    const currentX = x - left;
    const currentY = y - top;
    const lastPoint = this.activeSegment.points[this.activeSegment.points.length - 1];
    const [lastX, lastY] = lastPoint || [-1, -1];
    if (Math.abs(lastX - currentX) > this.tolerance || Math.abs(lastY - currentY) > this.tolerance) {
      this.activeSegment.points.push([x - left, y - top, pressure]);
      this.renderActiveSegment();
    }
  }

  private calculateContainerOffset() {
    const svgEl = this.svgElement.nativeElement;
    const { left, top } = svgEl.getBoundingClientRect();
    this.containerOffset = [left, top];
  }

  private renderActiveSegment() {
    const stroke = getStroke(this.activeSegment.points, { ...this.baseStrokeOptions, size: this.activeSegment.width });
    const path = getSvgPathFromStroke(stroke, this.precision);
    this.activeSegment.path.set(path);
  }

  public clearDraw() {
    this.activeSegment = this.createNewSegment();
    this.activeShape = null;
    this.shapeDragOrigin = null;
    this.shapeEditOrigin = null;
    this.activeArrow = null;
    this.arrowEditOrigin = null;
    this.activeHighlight = null;
    this.textDraft = null;
    this.selectedItemId.set(null);
    this.items = [];
    this.redoStack = [];
  }

  public undoSvgStroke() {
    const last = this.items.pop();
    if (!last) return;
    this.redoStack.push(last);
    this.selectedItemId.set(null);
  }

  public redoSvgStroke() {
    const last = this.redoStack.pop();
    if (!last) return;
    this.items.push(last);
    this.selectedItemId.set(last.item.id);
  }

  public finaliseActiveSegment() {
    if (this.activeSegment.points.length > 0) {
      this.items.push({ kind: 'segment', item: this.activeSegment });
    }
  }

  public finaliseActiveShape() {
    if (this.activeShape) {
      this.items.push({ kind: 'shape', item: this.activeShape });
    }
  }

  public trianglePoints(rect: Rect): string {
    const { x, y, width, height } = rect;
    return `${x + width / 2},${y} ${x},${y + height} ${x + width},${y + height}`;
  }

  /** Wrapped lines for a text label, capped to the canvas width remaining from its x position */
  public wrappedTextLines(text: TextAnnotation): string[] {
    const maxWidth = Math.max(this.canvasWidth() - text.x, 60);
    return wrapTextLines(text.text, text.fontSize, maxWidth);
  }

  /** Highlight bars for a word range: one rect per line, spanning the words (and gaps) on it */
  public highlightRects(h: TextHighlight): Rect[] {
    const text = this.findText(h.textId);
    if (!text) return [];
    const from = Math.min(h.from, h.to);
    const to = Math.max(h.from, h.to);
    const rects: (Rect & { line: number })[] = [];
    for (const w of this.wordBoxes(text)) {
      if (w.index < from || w.index > to) continue;
      const last = rects[rects.length - 1];
      if (last && last.line === w.line) {
        last.width = w.x + w.width - last.x;
      } else {
        rects.push({ x: w.x, y: w.y, width: w.width, height: w.height, line: w.line });
      }
    }
    return rects;
  }

  public finaliseActiveArrow() {
    if (this.activeArrow) {
      this.items.push({ kind: 'arrow', item: this.activeArrow });
    }
  }

  public commitTextEdit(value: string) {
    if (!this.textDraft) return;
    const { x, y, editingId, color, fontSize } = this.textDraft;
    const text = value.trim();

    if (editingId) {
      if (text) {
        const updated: TextAnnotation = { id: editingId, x, y, text, color, fontSize };
        this.items = this.items.map((entry) =>
          entry.kind === 'text' && entry.item.id === editingId ? { kind: 'text', item: updated } : entry,
        );
        this.selectedItemId.set(editingId);
      } else {
        this.items = this.items.filter(
          (entry) =>
            !(entry.kind === 'text' && entry.item.id === editingId) &&
            !(entry.kind === 'highlight' && entry.item.textId === editingId),
        );
        this.selectedItemId.set(null);
      }
      this.onChange.emit(this.sanitizeOutputSVG());
    } else if (text) {
      const annotation: TextAnnotation = { id: generateID(5), x, y, text, color, fontSize };
      this.items.push({ kind: 'text', item: annotation });
      this.selectedItemId.set(annotation.id);
      this.onChange.emit(this.sanitizeOutputSVG());
    }
    this.textDraft = null;
  }

  public cancelTextEdit() {
    this.textDraft = null;
  }

  /** Grow the textarea to fit its content (including wrapped/manual line breaks) as the user types */
  public onTextDraftInput(el: HTMLTextAreaElement) {
    // keep the draft's value current as the user types, so a pointerdown elsewhere on the canvas
    // (which fires before the textarea's blur) can commit this exact draft instead of racing it
    if (this.textDraft) this.textDraft.value = el.value;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  public displayItems(): HistoryEntry[] {
    const editingId = this.textDraft?.editingId;
    const items = editingId
      ? this.items.filter(
          (entry) =>
            !(entry.kind === 'text' && entry.item.id === editingId) &&
            !(entry.kind === 'highlight' && entry.item.textId === editingId),
        )
      : this.items;
    const inProgress: HistoryEntry[] = [];
    if (this.activeSegment.path()) inProgress.push({ kind: 'segment', item: this.activeSegment });
    if (this.activeShape) inProgress.push({ kind: 'shape', item: this.activeShape });
    if (this.activeArrow) inProgress.push({ kind: 'arrow', item: this.activeArrow });
    if (this.activeHighlight) inProgress.push({ kind: 'highlight', item: this.activeHighlight });
    return inProgress.length > 0 ? [...items, ...inProgress] : items;
  }

  public arrowMarkers(): Arrow[] {
    const arrows = this.items
      .filter((entry) => entry.kind === 'arrow')
      .map((entry) => entry.item)
      .filter((arrow) => arrow.tool === 'arrow');
    return this.activeArrow?.tool === 'arrow' ? [...arrows, this.activeArrow] : arrows;
  }

  /** Redaction boxes drawn with the blur style - rendered as a filtered copy of the canvas, clipped to the box */
  public styledRedactions(): Shape[] {
    return this.displayItems()
      .filter(
        (e): e is { kind: 'shape'; item: Shape } =>
          e.kind === 'shape' && e.item.tool === 'redaction' && e.item.redactStyle === 'blur',
      )
      .map((e) => e.item);
  }

  private findText(id: string): TextAnnotation | undefined {
    const entry = this.items.find((e) => e.kind === 'text' && e.item.id === id);
    return entry?.kind === 'text' ? entry.item : undefined;
  }

  private wordBoxes(text: TextAnnotation): WordBox[] {
    return layoutWords(text, this.wrappedTextLines(text));
  }

  private findWordAtPoint(x: number, y: number): { text: TextAnnotation; index: number } | undefined {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const entry = this.items[i];
      if (entry.kind !== 'text') continue;
      const hit = this.wordBoxes(entry.item).find((w) =>
        rectContains({ x: w.x - 6, y: w.y - 4, width: w.width + 12, height: w.height + 8 }, x, y),
      );
      if (hit) return { text: entry.item, index: hit.index };
    }
    return undefined;
  }

  /** Closest word to the pointer, preferring the line the pointer is on, so drags snap cleanly */
  private nearestWordIndex(text: TextAnnotation, x: number, y: number): number {
    let best = -1;
    let bestScore = Infinity;
    for (const w of this.wordBoxes(text)) {
      const dy = y < w.y ? w.y - y : y > w.y + w.height ? y - (w.y + w.height) : 0;
      const dx = x < w.x ? w.x - x : x > w.x + w.width ? x - (w.x + w.width) : 0;
      const score = dy * 1000 + dx;
      if (score < bestScore) {
        bestScore = score;
        best = w.index;
      }
    }
    return best === -1 ? (this.activeHighlight?.to ?? 0) : best;
  }

  private findTextAtPoint(x: number, y: number): { text: TextAnnotation; mode: 'move' | 'resize' } | undefined {
    const handleRadius = 10;
    const padding = 6;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const entry = this.items[i];
      if (entry.kind !== 'text') continue;
      const el = this.svgElement.nativeElement.querySelector(`#${CSS.escape(entry.item.id)}`);
      let box: { x: number; y: number; width: number; height: number } = {
        x: entry.item.x,
        y: entry.item.y,
        ...estimateTextBoxSize(entry.item.text, entry.item.fontSize),
      };
      if (el instanceof SVGTextElement) {
        box = el.getBBox();
      }
      if (Math.hypot(x - (box.x + box.width + 4), y - (box.y + box.height / 2)) <= handleRadius) {
        return { text: entry.item, mode: 'resize' };
      }
      const withinX = x >= box.x - padding && x <= box.x + box.width + padding;
      const withinY = y >= box.y - padding && y <= box.y + box.height + padding;
      if (withinX && withinY) return { text: entry.item, mode: 'move' };
    }
    return undefined;
  }

  private findAnyShapeAtPoint(x: number, y: number): { shape: Shape; mode: 'move' | 'resize' } | undefined {
    const handleRadius = 14;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const entry = this.items[i];
      if (entry.kind !== 'shape') continue;
      const rect = entry.item.rect();
      if (Math.hypot(x - (rect.x + rect.width), y - (rect.y + rect.height)) <= handleRadius) {
        return { shape: entry.item, mode: 'resize' };
      }
      if (rectContains(rect, x, y)) {
        return { shape: entry.item, mode: 'move' };
      }
    }
    return undefined;
  }

  private findAnyArrowAtPoint(x: number, y: number): { arrow: Arrow; mode: 'move' | 'start' | 'end' } | undefined {
    const handleRadius = 10;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const entry = this.items[i];
      if (entry.kind !== 'arrow') continue;
      const line = entry.item.line();
      if (Math.hypot(x - line.x1, y - line.y1) <= handleRadius) return { arrow: entry.item, mode: 'start' };
      if (Math.hypot(x - line.x2, y - line.y2) <= handleRadius) return { arrow: entry.item, mode: 'end' };
      if (distanceToSegmentSquared(x, y, line.x1, line.y1, line.x2, line.y2) <= handleRadius ** 2) {
        return { arrow: entry.item, mode: 'move' };
      }
    }
    return undefined;
  }
}

/**
 * Rough fallback size for a (possibly multi-line) text label, used only when the real rendered
 * element can't be measured via getBBox() yet (e.g. the very first render).
 */
function estimateTextBoxSize(text: string, fontSize: number): { width: number; height: number } {
  const lines = text.split('\n');
  const longestLine = Math.max(...lines.map((line) => line.length), 1);
  return { width: longestLine * (fontSize * 0.6), height: lines.length * fontSize * 1.2 };
}

/** btoa() throws on characters outside Latin1 (e.g. accented letters in a text annotation) */
function toBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

/**
 * Always resolves to a self-contained data URL, never a plain URL reference - once this ends up
 * inside sanitizeOutputSVG()'s output and gets re-encoded as its own data URL for persistence, a
 * relative/remote URL reference nested inside has nothing to resolve against and fails to decode.
 */
async function resolveImageSrc(image: string | Blob): Promise<string> {
  if (typeof image === 'string') {
    if (image.startsWith('data:')) return image;
    image = await fetch(image).then((res) => res.blob());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(image as Blob);
  });
}

function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function wrapTextLines(text: string, fontSize: number, maxWidth: number): string[] {
  const avgCharWidth = fontSize * 0.55;
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && candidate.length > maxCharsPerLine) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

let measureCtx: CanvasRenderingContext2D | null = null;

/** Real text width via canvas, using the same font the SVG text renders with */
function measureTextWidth(value: string, fontSize: number): number {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return value.length * fontSize * 0.55;
  measureCtx.font = `${fontSize}px sans-serif`;
  return measureCtx.measureText(value).width;
}

/** Position of every word in a wrapped text label, in canvas coordinates */
function layoutWords(text: TextAnnotation, lines: string[]): WordBox[] {
  const lineHeight = text.fontSize * 1.2;
  const boxes: WordBox[] = [];
  let index = 0;
  lines.forEach((line, lineIdx) => {
    let offset = 0;
    for (const word of line.split(' ')) {
      if (word) {
        boxes.push({
          index: index++,
          line: lineIdx,
          x: text.x + measureTextWidth(line.slice(0, offset), text.fontSize),
          y: text.y + lineIdx * lineHeight - text.fontSize * 0.1,
          width: measureTextWidth(word, text.fontSize),
          height: lineHeight,
        });
      }
      offset += word.length + 1;
    }
  });
  return boxes;
}

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

function distanceToSegmentSquared(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return (px - closestX) ** 2 + (py - closestY) ** 2;
}

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
