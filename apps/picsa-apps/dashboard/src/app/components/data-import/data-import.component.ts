import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { DataImportClipboardPasteComponent } from './adaptors/clipboard-paste.component';
import { DataImportFileDropComponent } from './adaptors/file-drop.component';

/**
 * Provide tabbed interface to import data as CSV or JSON,
 * either from local file input or clipboard paste
 */
@Component({
  selector: 'dashboard-data-import',
  imports: [MatTabsModule, DataImportFileDropComponent, DataImportClipboardPasteComponent],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataImportComponent {
  public dataLoaded = output<any[]>();
}
