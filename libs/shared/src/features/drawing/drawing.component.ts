import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { getStroke } from 'perfect-freehand';

type Point = [number, number, number];
type Segment = Point[];
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
      taper: 0,
      easing: (t) => t,
      cap: true,
    },
  };

  /** [x,y,pressure] point representation */
  public points: Segment = [];
  public segments: Segment[] = [];
  public undoStack: Segment[][] = [];
  public redoStack: Segment[][] = [];

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
    this.renderPath();
  }

  handlePointerMove(event: PointerEvent) {
    if (event.buttons !== 1) return;
    this.addPointToPath(event.pageX, event.pageY);
    this.renderPath();
    this._pushToUndo();
  }

  handlePointerUp() {
    this._endCurrentStroke();
  }

  /** Add a point to the current path, adjusting absolute position for relative container */
  private addPointToPath(x: number, y: number, pressure = 0.5) {
    const [left, top] = this.containerOffset;
    this.points.push([x - left, y - top, pressure]);
    this.segments.push(this.points);
  }

  /** Determine current positioning of svg drawing container to use for path offsets */
  private calculateContainerOffset() {
    const svgEl = this.svgElement.nativeElement;
    const { left, top } = svgEl.getBoundingClientRect();
    this.containerOffset = [left, top];
  }

  /** Render an svg path element generated from current list of points */
  private renderPath() {
    const allPaths = this.segments.flatMap((segment) => this.getSvgPathFromStroke(getStroke(segment))).join(' ');
    this.pathData.set(allPaths);
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

  /* Push to Undo Stack */
  private _pushToUndo() {
    if (this.points.length > 0) {
      this.undoStack.push([...this.segments]);
      this.redoStack = [];
    }
  }

  /* Clear Draw */
  public clearDraw() {
    this.segments = [];
    this.points = [];
    this.renderPath();
    this._pushToUndo();
  }

  /* Undo previous Stroke render */
  public undoSvgStroke() {
    if (this.undoStack.length > 0) {
      //   const currentState = this.undoStack.pop();
      //   this.redoStack.push(currentState as Segment[]);
      //   if (currentState && currentState.length > 0) {
      //     this.segments = currentState;
      //     const allPaths = this.segments.map((segment) => this.getSvgPathFromStroke(getStroke(segment)));
      //     this.pathData.set(allPaths.join(' '));
      //   }
      // } else {
      //   return;
      // }

      const previousState = this.undoStack.pop();
      previousState ? this.redoStack.push(previousState): null;
      

      if (previousState) {
        this.undoStack[this.undoStack.length - 1];
        this.segments = previousState;
        console.log(this.segments);
        // Re-render all paths
        const allPaths = this.segments.flatMap((segment) => this.getSvgPathFromStroke(getStroke(segment)));
            this.pathData.set(allPaths.join(' '));
        // this.renderPath();
      }
    }
  }

  /* Redo Stroke render */
  public redoSvgStroke() {
    if (this.redoStack.length) {
      const currentState = this.redoStack.pop();
      if (currentState) {
        this.undoStack.push(currentState);
        this.segments = currentState;
        this.renderPath();
      }
    } else {
      return;
    }
  }

  /* End the current stroke */
  public _endCurrentStroke() {
    if (this.points.length > 0) {
      this.segments.push([...this.points]);
      this._pushToUndo();
    }
    this.points = [];
    this.renderPath();
  }
}
