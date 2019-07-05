import { Component, OnInit } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { Papa, PapaParseConfig } from 'ngx-papaparse';
import { HttpClient } from '@angular/common/http';
import { ISite, IChartSummary2019 } from '@picsa/core/models';

@Component({
  selector: 'station-data-upload',
  templateUrl: './data-upload.page.html',
  styleUrls: ['./data-upload.page.scss']
})
export class DataUpload implements OnInit {
  files: NgxFileDropEntry[];
  csvFile: File;
  csvData: any[] = [];
  csvFields: string[] = [];
  siteDataMapping = SITE_DATA_MAPPINGS;

  constructor(private papa: Papa, private http: HttpClient) {}

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

  public async loadDemoData() {
    this.csvFile = { name: 'station-data-example.csv' } as File;
    const data = await this.http
      .get('assets/data/station-data-example.csv', {
        responseType: 'text'
      })
      .toPromise();
    await this.generateCSVPreview(data);
    this.generateDataMappings();
  }

  // when csv is loaded generate best-guess mappings for the required fields
  // based on regex of first 4 characters of field name
  private async generateDataMappings() {
    const csvFields = this.csvFields.map(field => field.toLowerCase());
    const mapped = this.siteDataMapping.map(el => {
      const matchString = el.field.substr(0, 4).toLowerCase();
      const matchField = csvFields.find(f => f.includes(matchString));
      return { ...el, mappedField: matchField ? matchField : '' };
    });
    this.siteDataMapping = mapped;
  }

  /******************************************************************************
   *    CSV Methods
   ******************************************************************************/

  // generates a 5-row parse of csv file for display in table
  private async generateCSVPreview(csv: string | File) {
    const previewData = await this.parseCSV(csv, {
      preview: 5,
      header: true
    });
    this.csvFields = Object.keys(previewData[0]);
    this.csvData = previewData;
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

/******************************************************************************
 *    Interfaces
 ******************************************************************************/
interface ISiteDataField {
  field: keyof IChartSummary2019;
  description: string;
  dataType: 'string' | 'number' | 'date';
}
interface ISiteDataMapping extends ISiteDataField {
  mappedField: string;
}

/******************************************************************************
 *    Constants
 ******************************************************************************/
const SITE_DATA_FIELDS: ISiteDataField[] = [
  {
    field: 'Season',
    description:
      'A name for the season. This could be the year, e.g. 2009, or any other name such as "2009-10',
    dataType: 'number'
  },
  {
    field: 'Length',
    description: 'The total number of days the season lasted, e.g. 102',
    dataType: 'number'
  },
  {
    field: 'Rainfall',
    description:
      'The total amount of rain, in mm, that fell during the season, e.g. 890',
    dataType: 'number'
  },
  {
    field: 'StartDate',
    description:
      'The date when the season started, e.g. "04-Mar-2010" or "25/8/11"',
    dataType: 'date'
  }
];

const SITE_DATA_MAPPINGS: ISiteDataMapping[] = SITE_DATA_FIELDS.map(field => ({
  ...field,
  mappedField: ''
}));
