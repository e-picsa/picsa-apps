import { Component, OnInit } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { Papa, PapaParseConfig } from 'ngx-papaparse';

@Component({
  selector: 'station-data-upload',
  templateUrl: './data-upload.page.html',
  styleUrls: ['./data-upload.page.scss']
})
export class DataUpload implements OnInit {
  files: NgxFileDropEntry[];
  csvFile: File;
  tableData: any[] = [];
  constructor(private papa: Papa) {}

  ngOnInit() {}

  public dropped(files: NgxFileDropEntry[]) {
    console.log('files dropped', files);
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          if (file.name.includes('.csv')) {
            this.csvFile = file;
            this.generateCSVPreview(file);
          }
        });
      }
    }
  }

  private async generateCSVPreview(file: File) {
    const previewData = await this.parseCSV(file, {
      preview: 5,
      header: true
    });
    this.tableData = previewData;
  }

  // promise wrapper for papa.parse callback
  // also includes 'header' which formats as json array instead of data row array
  private parseCSV(
    csv: string | File,
    config?: PapaParseConfig
  ): Promise<any[]> {
    console.log('parsing csv');
    return new Promise((resolve, reject) => {
      this.papa.parse(csv, {
        header: true,
        complete: (results, file) => resolve(results.data),
        error: err => reject(err),
        ...config
      });
    });
  }
}
