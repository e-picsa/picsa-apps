import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'farmer-content-home-fab',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <button matIconButton routerLink="/farmer" class="home-btn">
      <mat-icon>home</mat-icon>
    </button>
  `,
  styleUrl: './home-fab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentHomeFabComponent {}
