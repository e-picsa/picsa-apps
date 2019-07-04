import { Component, OnInit } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';

@Component({
  selector: 'station-data-upload',
  templateUrl: './data-upload.page.html',
  styleUrls: ['./data-upload.page.scss']
})
export class DataUpload implements OnInit {
  files: NgxFileDropEntry[];
  csvFile: File;
  constructor() {}

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
          }
        });
      }
    }
  }
}
