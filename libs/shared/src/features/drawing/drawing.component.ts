import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { getStroke } from 'perfect-freehand';

@Component({
  selector: 'picsa-custom-drawing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent {
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

  getSvgPathFromStroke(stroke) {
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
