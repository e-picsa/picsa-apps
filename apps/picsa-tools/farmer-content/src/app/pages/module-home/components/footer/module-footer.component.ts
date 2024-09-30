import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import type { ITabContent } from '../../module-home.component';

@Component({
  selector: 'farmer-module-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './module-footer.component.html',
  styleUrl: './module-footer.component.scss',
})
export class FarmerModuleFooterComponent {
  public tabs = input.required<ITabContent[]>();

  public selectedIndex = model.required<number>();

  public goHome() {
    this.router.navigate(['/', 'farmer'], { replaceUrl: true });
  }

  constructor(private router: Router) {}

  public nextTab() {
    this.selectedIndex.update((v) => v + 1);
  }

  public previousTab() {
    this.selectedIndex.update((v) => v - 1);
  }
}
