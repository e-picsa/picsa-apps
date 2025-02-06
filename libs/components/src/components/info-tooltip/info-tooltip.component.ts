import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule, TooltipPosition } from '@angular/material/tooltip';

@Component({
  selector: 'picsa-info-tooltip',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './info-tooltip.component.html',
  styleUrl: './info-tooltip.component.scss',
})
export class PicsaInfoTooltipComponent {
  @Input() message = '';
  @Input() position: TooltipPosition = 'below';
}
