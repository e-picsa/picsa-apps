import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-module-footer',
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './module-footer.component.html',
  styleUrl: './module-footer.component.scss',
})
export class FarmerModuleFooterComponent {
  public totalSections = input.required<number>();

  public selectedIndex = model.required<number>();

  public goHome() {
    this.router.navigate(['/', 'farmer'], { replaceUrl: true });
  }

  constructor(private router: Router) {}

  public next() {
    this.selectedIndex.update((v) => v + 1);
  }

  public previous() {
    this.selectedIndex.update((v) => v - 1);
  }
}
