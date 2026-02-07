import { ChangeDetectionStrategy, Component, isDevMode } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'dashboard-server-error-layout',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './server-error.component.html',
  styleUrl: './server-error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerErrorLayoutComponent {
  protected readonly isDevMode = isDevMode();

  public retryConnection(): void {
    window.location.reload();
  }
}
