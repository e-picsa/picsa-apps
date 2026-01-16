import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaFormsModule } from '@picsa/forms';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap, arrayToHashmapArray, jsonToCSV } from '@picsa/utils';
import { isObjectLiteral } from '@picsa/utils/object.utils';
import download from 'downloadjs';

import { DataImportComponent } from '../../../../components/data-import/data-import.component';
import { DashboardMaterialModule } from '../../../../material.module';
import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { CropInformationService, ICropDataDownscaled, ICropDataDownscaledWaterRequirements } from '../../services';
import { CropMissingLocationsComponent } from './components/components/missing-locations.component';

interface ICropDataImport {
  location_id: string;
  crop: string;
  variety: string;
  water_requirement: number;
  /** Value of water requirement currently on server for comparison */
  _water_requirement_server?: number;
  /** Track input csv row numbers */
  _row_number?: number;
  /** Track errors */
  _error?: string;
  /** Use location/crop/variety combined key to track unique hash */
  _hash?: string;
}

/**
 * Crop Information management page
 * Enables import and quality-check of crop water requirements
 *
 * Water requirements are imported as individual rows, cleaned and merged by location.
 * Merged requirements are compared against server ahead of import, and then updated
 *
 * TODO
 * - Consider warning check if crop id not in main DB
 */
@Component({
  selector: 'dashboard-crop-admin',
  imports: [
    CommonModule,
    DataImportComponent,
    PicsaDataTableComponent,
    DashboardMaterialModule,
    CropMissingLocationsComponent,
    PicsaFormsModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCropAdminComponent {
  public errors = signal<ICropDataImport[]>([]);
  public errorTableOptions: IDataTableOptions = {
    displayColumns: ['_row_number', 'location_id', 'crop', 'variety', 'water_requirement', '_error'],
    paginatorSizes: [5, 20, 50],
    search: false,
    formatHeader: (v) => {
      if (v === '_row_number') return '#';
      return formatHeaderDefault(v);
    },
  };
  public duplicates = signal<ICropDataImport[]>([]);
  public parsedRows = signal<ICropDataImport[]>([]);

  public updates = signal<ICropDataImport[]>([]);
  public updateTableOptions: IDataTableOptions = {
    displayColumns: ['location_id', 'crop', 'variety', '_water_requirement_server', 'water_requirement'],
    paginatorSizes: [5, 20, 50],
    search: false,
    formatHeader: (v) => {
      if (v === '_water_requirement_server') return 'Water Requirement (before)';
      if (v === 'water_requirement') return 'Water Requirement (after)';
      return formatHeaderDefault(v);
    },
  };

  public insertRows = signal<ICropDataDownscaled['Insert'][]>([]);

  public countryCode = computed(() => this.deploymentService.activeDeploymentCountry());

  constructor(
    private service: CropInformationService,
    private deploymentService: DeploymentDashboardService,
    public dialog: MatDialog,
  ) {
    service.ready();
    effect(async () => {
      const parsedRows = this.parsedRows();
      if (parsedRows.length > 0) {
        // TODO - consider showing processing message while waiting
        await this.prepareImport(parsedRows);
      }
    });
  }

  public handleDataLoad(data: any) {
    const { rows, errors, duplicates } = this.qualityControlData(data);
    this.errors.set(errors);
    this.duplicates.set(duplicates);
    this.parsedRows.set(rows);
  }

  public downloadTemplate(selectedLocation: (string | undefined)[]) {
    const cropData = this.service.cropData();
    const location_id = selectedLocation.filter((v) => v !== undefined).pop() as string;
    const dummyRows: ICropDataImport[] = cropData.map(({ crop, variety }) => ({
      location_id,
      crop,
      variety,
      water_requirement: '' as any,
    }));
    const csv = jsonToCSV(dummyRows);
    download(csv, `crop-water-requirements.${location_id}.csv`);
  }

  public async processImport(rows: ICropDataDownscaled['Insert'][]) {
    return this.service.upsertDownscaled(rows);
  }

  private async prepareImport(rows: ICropDataImport[]) {
    const { country_code } = this.deploymentService.activeDeployment();

    const { data, error } = await this.service.cropDataDownscaledTable
      .select<'*', ICropDataDownscaled['Row']>('*')
      .eq('country_code', country_code);

    // server rows have a single entry per location. Inner merge to provide
    // individual rows per crop variety (same as import rows)
    const serverRows = this.entryToImport(data || []);
    const serverHashmap = arrayToHashmap(serverRows, '_hash');

    // merge server water requirement and filter out unchanged duplicates
    const filtered = rows
      .map((row) => {
        row._water_requirement_server = serverHashmap[row._hash as string]?.water_requirement;
        return row;
      })
      .filter((v) => v.water_requirement !== v._water_requirement_server);

    this.updates.set(filtered);

    // convert to merged rows for insert
    const insertRows = this.importToEntry(filtered, country_code);
    this.insertRows.set(insertRows);
  }

  /** Convert flat import data type to nested db entries */
  private importToEntry(data: ICropDataImport[], country_code: string) {
    const merged: Record<string, ICropDataDownscaledWaterRequirements> = {};
    for (const entry of data) {
      const { crop, location_id, variety, water_requirement } = entry;
      merged[location_id] ??= {};
      merged[location_id][crop] ??= {};
      merged[location_id][crop][variety] = water_requirement;
    }
    const entryRows: ICropDataDownscaled['Insert'][] = Object.entries(merged).map(
      ([location_id, water_requirements]) => {
        const entry: ICropDataDownscaled['Insert'] = { country_code, location_id, water_requirements };
        return entry;
      },
    );
    return entryRows;
  }
  /** Convert nested db entries to flat import data type */
  private entryToImport(data: ICropDataDownscaled['Row'][] = []) {
    const importRows: ICropDataImport[] = [];
    for (const { location_id, water_requirements } of data) {
      for (const [crop, varietyData] of Object.entries(water_requirements as ICropDataDownscaledWaterRequirements)) {
        for (const [variety, water_requirement] of Object.entries(varietyData)) {
          const importRow: ICropDataImport = { crop, location_id, variety, water_requirement };
          importRow._hash = this.getEntryHash(importRow);
          importRows.push(importRow);
        }
      }
    }
    return importRows;
  }

  private getLocationList() {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    return locationData.admin_5?.locations || locationData.admin_4?.locations;
  }

  private qualityControlData(data: ICropDataImport[] = []) {
    const rows: ICropDataImport[] = [];
    const errors: ICropDataImport[] = [];
    const duplicates: ICropDataImport[] = [];

    if (!Array.isArray(data)) {
      errors.push({ _error: 'Data Invalid' } as any);
      return { rows, duplicates, errors };
    }

    const locations = this.getLocationList();
    const locationHashmap = arrayToHashmap(locations, 'id');

    // add row numbers
    const withRowNumbers = data.map((v, i) => {
      v._row_number = i + 1;
      return v;
    });

    // remove empty rows or malformed entires
    const cleaned = withRowNumbers.filter((v) => isObjectLiteral(v));

    // remove individual entries failing QC checks
    const errorChecked = cleaned.filter((v) => {
      const { _error } = this.checkForErrors(v, locationHashmap);
      if (_error) {
        errors.push(v);
      }
      return true;
    });

    // create hashed entries to detect and remove duplicates
    const hashed = errorChecked.map((v) => {
      v._hash = this.getEntryHash(v);
      return v;
    });
    const hashmapArray = arrayToHashmapArray(hashed, '_hash');
    for (const hashedValues of Object.values(hashmapArray)) {
      const unique = [...new Set(hashedValues.map((v) => v.water_requirement))];
      // single unique value, or multiple identical
      if (unique.length === 1) {
        const [row, ...duplicateRows] = hashedValues;
        rows.push(row);
        duplicates.push(...duplicateRows);
      }
      // duplicate entries with different values
      else {
        for (const value of hashedValues) {
          value._error = `Multiple Values: ${unique.join(', ')}`;
          errors.push(value);
        }
      }
    }

    return { rows, errors, duplicates };
  }

  private getEntryHash(entry: ICropDataImport) {
    const { location_id, crop, variety } = entry;
    return `${location_id}/${crop}/${variety}`;
  }

  /**
   * Minimal QC check that location exists in data
   * Additional checks for crop types and varieties managed in other pages
   */
  private checkForErrors(el: ICropDataImport, locationHashmap: Record<string, any>) {
    const { location_id, water_requirement } = el;

    // check location exists
    const location_id_cleaned = location_id.trim().toLowerCase().replace(' ', '');
    if (!locationHashmap[location_id_cleaned]) {
      el._error = `Invalid location: ${location_id}`;
    }
    el.location_id = location_id_cleaned;

    // round water requirement to nearest 5
    const water_requirement_parsed = Number(water_requirement);
    if (isNaN(water_requirement_parsed)) {
      el._error = `Invalid water requirement: ${water_requirement}`;
    } else {
      const water_requirement_cleaned = roundToNearest(water_requirement_parsed, 5);
      el.water_requirement = water_requirement_cleaned;
    }

    return el;
  }
}

function roundToNearest(value: number, n: number) {
  return Math.round(value / n) * n;
}
