/* eslint-disable @nx/enforce-module-boundaries */

// Ensure Uppy styles imported
import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';

import { ChangeDetectionStrategy, Component, effect, ElementRef, input, output, viewChild } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { loadCSV } from '@picsa/utils';
import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

/**
 * File dropzone component that accepts json or csv files and parses data
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'uppy-file-drop',
  imports: [],
  templateUrl: './uppy-file-drop.component.html',
  styleUrls: ['./uppy-file-drop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UppyFileDropComponent {
  private uppy: Uppy;
  private dropEl = viewChild('dragDrop', { read: ElementRef });

  public dataLoaded = output<any[]>();
  public note = input('Accepts CSV or JSON Data');

  constructor(private notificationService: PicsaNotificationService) {
    effect(() => {
      const el = this.dropEl();
      if (el) {
        this.setupDropZone(el.nativeElement);
      }
    });
  }

  private setupDropZone(target: ElementRef<HTMLDivElement>) {
    if (this.uppy) return;
    const note = this.note();
    this.uppy = new Uppy({ restrictions: { allowedFileTypes: ['.csv', '.json'], maxNumberOfFiles: 1 } }).use(DragDrop, {
      target: target as any,
      inputName: 'file',
      replaceTargetContent: true,
      id: 'file',
      allowMultipleFiles: false,
      note,
    });
    this.uppy.on('file-added', async ({ data, type }) => {
      this.uppy.setOptions({
        restrictions: {},
      });
      switch (type) {
        case 'text/csv':
          return this.handleCSVFileDrop(data);
        case 'application/json':
          return this.handleJSONFileDrop(data);
        default:
          this.notificationService.showErrorNotification(`Invalid file type: ${type}`);
          break;
      }
    });
  }

  private async handleCSVFileDrop(data: Blob | File) {
    const text = await data.text();
    const rows = await loadCSV(text, { header: true, skipEmptyLines: true });
    this.dataLoaded.emit(rows);
  }
  private async handleJSONFileDrop(data: Blob | File) {
    const text = await data.text();
    const rows = JSON.parse(text);
    this.dataLoaded.emit(rows);
  }
}
