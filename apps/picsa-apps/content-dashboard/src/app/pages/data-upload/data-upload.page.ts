import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { IChartSummary_V2 } from '@picsa/models';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { Papa, PapaParseConfig } from 'ngx-papaparse';

@Component({
  selector: 'dashboard-data-upload',
  templateUrl: './data-upload.page.html',
  styleUrls: ['./data-upload.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class DataUpload {
  files: NgxFileDropEntry[];
  csvFile: File;
  csvData: IParsedField[] = [];
  demoData: string;
  csvMappedData: IChartSummary_V2[] = [];
  csvFields: string[] = [];
  mappedFields: string[] = [];
  rainfallChartData: any;
  siteDataMapping = SITE_DATA_MAPPINGS;

  constructor(private papa: Papa, private http: HttpClient) {}

  public fileDropped(files: NgxFileDropEntry[]) {
    console.log('files dropped', files);
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {
          if (file.name.includes('.csv')) {
            this.csvFile = file;
            await this.generateCSVData(file, true);
            this.generateDataMappings();
          }
        });
      }
    }
  }
  public async loadDemoData() {
    this.csvFile = { name: 'station-data-example.csv' } as File;
    this.demoData = await this.loadFile('assets/data/station-data-example.csv');
    await this.generateCSVData(this.demoData, true);
    this.generateDataMappings();
  }

  // after data has been previewed and mapped process full data on next step
  public async processFullCSVData() {
    // determine if using demo data or full csv
    const csv = this.demoData ? this.demoData : this.csvFile;
    await this.generateCSVData(csv);
    this.mapCSVData();
    this.generateChartData();
  }

  private loadFile(path: string): Promise<string> {
    return this.http.get(path, { responseType: 'text' }).toPromise();
  }

  /******************************************************************************
   *    Chart Methods
   ******************************************************************************/
  private generateChartData() {
    this.rainfallChartData = {
      json: this.csvMappedData,
      keys: {
        x: 'Year',
        value: ['Rainfall'],
      },
    };
  }

  /******************************************************************************
   *    Drag-drop Methods
   ******************************************************************************/
  public dragDropped(event: CdkDragDrop<string[]>) {
    // don't allow reordering in same list
    if (event.previousContainer !== event.container) {
      // move existing out (limit 1 per container)
      if (event.container.data.length > 0) {
        // empty container, transfer existing item out first
        transferArrayItem(event.container.data, this.csvFields, 0, this.csvFields.length - 1);
      }
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      // prepare data preview
      this.mapCSVData();
    }
  }

  /******************************************************************************
   *    Data mapping
   ******************************************************************************/

  // when csv is loaded generate best-guess mappings for the required fields
  // based on regex of first 4 characters of field name
  private async generateDataMappings() {
    this.siteDataMapping.forEach((el, i) => {
      // do field mapping each time as original this.csvFields directly altered on match
      const csvFields = this.csvFields.map((field) => field.toLowerCase());
      const matchString = el.field.toString().substr(0, 4).toLowerCase();
      const matchField = csvFields.find((f) => f.includes(matchString));
      // if match found remove from csvFields array and populate mapping array
      if (matchField) {
        transferArrayItem(this.csvFields, this.siteDataMapping[i].mappedField, csvFields.indexOf(matchField), 0);
      }
    });
    console.log('site mapping', this.siteDataMapping);
    this.mapCSVData();
  }

  mapCSVData() {
    // get the names of fields that have been mapped
    const map: any = {};
    this.siteDataMapping.forEach((mapping) => {
      map[mapping.field] = mapping.mappedField[0];
    });
    // map data where exists
    this.csvMappedData = this.csvData.map((el) => {
      const summary: IChartSummary_V2 = {
        Year: map.Year ? Number(el[map.Year]) : null,
        StartDate: map.StartDate ? new Date(el[map.StartDate]) : null,
        Length: map.Length ? Number(el[map.Length]) : null,
        Rainfall: map.Rainfall ? Number(el[map.Rainfall]) : null,
      };
      // check for invalid dates
      if (isNaN(summary.StartDate.getDate())) {
        summary.StartDate = null;
      }
      return summary;
    });
  }

  /******************************************************************************
   *    CSV Methods
   ******************************************************************************/

  // generates a 5-row parse of csv file for display in table
  private async generateCSVData(csv: string | File, preview = false) {
    const data = await this.parseCSV(csv, {
      preview: preview ? 5 : 0,
      header: true,
    });
    this.csvFields = Object.keys(data[0]);
    this.csvData = data;
  }

  // promise wrapper for papa.parse callback
  // also includes 'header' which formats as json array instead of data row array
  private parseCSV(csv: string | File, config?: PapaParseConfig): Promise<any[]> {
    console.log('parsing csv');
    return new Promise((resolve, reject) => {
      this.papa.parse(csv, {
        header: true,
        complete: (results, file) => resolve(results.data),
        error: (err) => reject(err),
        ...config,
      });
    });
  }
}

/******************************************************************************
 *    Interfaces
 ******************************************************************************/
interface ISiteDataField {
  field: keyof IChartSummary_V2;
  description: string;
  dataType: 'string' | 'number' | 'date';
}
interface ISiteDataMapping extends ISiteDataField {
  // as using drag and drop an array is passed instead of a single string (extracted later)
  mappedField: string[];
}
interface IParsedField {
  [field: string]: string;
}

/******************************************************************************
 *    Constants
 ******************************************************************************/
const SITE_DATA_FIELDS: ISiteDataField[] = [
  {
    field: 'Year',
    description:
      'The year in which the season started. If the season spans multiple years, e.g. "2009-2010", simply put "2009"',
    dataType: 'number',
  },
  {
    field: 'Length',
    description: 'The total number of days the season lasted, e.g. 102',
    dataType: 'number',
  },
  {
    field: 'Rainfall',
    description: 'The total amount of rain, in mm, that fell during the season, e.g. 890',
    dataType: 'number',
  },
  {
    field: 'StartDate',
    description: 'The date when the season started, e.g. "04-Mar-2010" or "25/8/11"',
    dataType: 'date',
  },
];

const SITE_DATA_MAPPINGS: ISiteDataMapping[] = SITE_DATA_FIELDS.map((field) => ({
  ...field,
  mappedField: [],
}));
