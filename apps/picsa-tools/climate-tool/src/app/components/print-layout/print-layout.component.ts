import { Component, Input } from '@angular/core';

@Component({
  selector: 'climate-print-layout',
  templateUrl: './print-layout.component.html',
  styleUrls: ['./print-layout.component.scss'],
})
export class ClimatePrintLayoutComponent {
  @Input() chartPng: string;
}
