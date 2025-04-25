import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, model, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

interface SectionData {
  title: string;
  icon: string;
  type: string;
  index: number;
}

@Component({
  selector: 'farmer-module-footer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './module-footer.component.html',
  styleUrl: './module-footer.component.scss',
})
export class FarmerModuleFooterComponent {
  public totalSections = input.required<number>();
  public selectedIndex = model.required<number>();
  @Output() selectedIndexChange = new EventEmitter<number>();
  public sections = input<SectionData[]>([]); // Input for the sections data
  router: any;

  public goHome() {
    this.router.navigate(['/', 'farmer'], { replaceUrl: true });
  }

  public navigateToSection(index: number) {
    this.selectedIndexChange.emit(index);
  }
}
