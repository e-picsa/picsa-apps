import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SkinToneService } from '../../dynamic-colour-svg.service';

@Component({
  standalone: true,
  selector: 'picsa-svg-colour-selector',
  imports: [CommonModule, MatIconModule, FormsModule, MatButtonModule],
  templateUrl: './colour-selector.component.html',
  styleUrls: ['./colour-selector.component.scss'],
})
export class SvgColourSelectorComponent {
  public skinToneOptions = [
    { label: 'Porcelain', color: '#EAC6BB' },
    // { label: 'Sand', color: '#F1C27D' },
    { label: 'Golden', color: '#E3B38D' },
    { label: 'Honey', color: '#D8A784' },
    { label: 'Caramel', color: '#C68E56' },
    { label: 'Bronze', color: '#B07D48' },
    { label: 'Almond', color: '#9E6B43' },
    { label: 'Umber', color: '#8D5524' },
    { label: 'Espresso', color: '#6F4E37' },
    { label: 'Cocoa', color: '#5C3836' },
    { label: 'Deep Cocoa', color: '#4C3024' },
    { label: 'Rich Ebony', color: '#3C2A21' },
    { label: 'Deep Ebony', color: '#2C1810' },
  ];
  public selectedColor: string;

  showSkinSelector = false;

  constructor(private skinToneService: SkinToneService) {}

  toggleSelector(): void {
    this.showSkinSelector = !this.showSkinSelector;
  }

  ngOnInit(): void {
    this.selectedColor = this.skinToneService.getCurrentSkinTone();
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    // this helps notify all subscribers about the change through the service
    this.skinToneService.updateSkinTone(color);
  }
}
