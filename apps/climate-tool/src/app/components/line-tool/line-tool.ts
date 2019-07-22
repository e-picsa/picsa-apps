import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'climate-line-tool',
  templateUrl: './line-tool.html',
  styleUrls: ['./line-tool.scss']
})
export class LineToolComponent implements OnInit {
  lineToolValue: number;
  @Input() min: number;
  @Input() max: number;

  constructor() {}

  ngOnInit(): void {}

  setLineToolValue() {
    console.log('setting line tool value', this.lineToolValue);
  }
}
