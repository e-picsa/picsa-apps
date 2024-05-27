import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
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
      taper: 0,
      easing: (t) => t,
      cap: true,
    },
  };
  /** [x,y,pressure] point representation */
  public points: [number, number, number][] = [];

  /** SVG representation of active path segment */
  public pathData = signal<string>('');

  private undoStack: [number, number, number][][] = [];

  private redoStack: [number, number, number][][] = [];

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
  }

  handlePointerUp(event: PointerEvent) {
    this._pushToUndo();
    this._endCurrentStroke(event);
  }

  /** Add a point to the current path, adjusting absolute position for relative container */
  private addPointToPath(x: number, y: number, pressure = 0.5) {
    const [left, top] = this.containerOffset;
    this.points.push([x - left, y - top, pressure]);
  }

  /** Determine current positioning of svg drawing container to use for path offsets */
  private calculateContainerOffset() {
    const svgEl = this.svgElement.nativeElement;
    const { left, top } = svgEl.getBoundingClientRect();
    this.containerOffset = [left, top];
  }

  /** Render an svg path element generated from current list of points */
  private renderPath() {
    const stroke = getStroke(this.points);
    const svgPath = this.getSvgPathFromStroke(stroke);
    this.pathData.set(svgPath);
    this._pushToUndo();
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
    this.undoStack.push([...this.points]);
  }

  /* Clear Draw */
  clearDraw() {
    this.points = [];
    this.renderPath();
  }

  /* Undo previous Stroke render */
  public undoSvgStroke() {
    if (this.undoStack.length) {
      const currentState = this.undoStack.pop();
      if (currentState) {
        this.redoStack.push(currentState);
        this.points = currentState;
        const stroke = getStroke(this.points);
        const svgPath = this.getSvgPathFromStroke(stroke);
        this.pathData.set(svgPath);
      }
    } else {
      return;
    }
  }

  /* Redo Stroke render */
  public redoSvgStroke() {
    if (this.redoStack.length) {
      const currentState = this.redoStack.pop();
      if (currentState) {
        this.undoStack.push(currentState);
        this.points = currentState;
        const stroke = getStroke(this.points);
        const svgPath = this.getSvgPathFromStroke(stroke);
        this.pathData.set(svgPath);
      }
    } else {
      return;
    }
  }

  public _startNewStroke() {
    if (this.points.length > 0) {
      this._pushToUndo(); // Save the current stroke before starting a new one
    }
    this.points = []; // Clear the points for the new stroke
  }

  // Method to end the current stroke
  public _endCurrentStroke(event: PointerEvent) {
    // this.addPointToPath(event.pageX, event.pageY);
    // this.points = null as never
    // this.points.push([0, 0, 0])
  }
}
