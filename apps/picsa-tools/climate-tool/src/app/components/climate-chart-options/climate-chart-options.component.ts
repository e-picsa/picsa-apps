import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ClimateShareDialogComponent } from '../share-dialog/share-dialog.component';

@Component({
  selector: 'climate-chart-options',
  templateUrl: './climate-chart-options.component.html',
  styleUrls: ['./climate-chart-options.component.scss'],
  standalone: false,
})
export class ClimateChartOptionsComponent {
  private dialog = inject(MatDialog);
  public async showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, { disableClose: true });
  }
}
