import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CROPS_DATA_HASHMAP, LOCALES_DATA, LOCALES_DATA_HASHMAP } from '@picsa/data';
import { getDeepestLocations } from '@picsa/data/geoLocation';
import { arrayToHashmap } from '@picsa/utils';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { CropInformationService } from '../../../../services';
import {
  CropPrintFormat,
  CropProbabilityPrintService,
  PrintExportStage,
} from '../../../../services/crop-probability-print.service';

interface ILocationGroup {
  id: string;
  label: string;
  districts: { id: string; label: string; available: boolean }[];
}

interface ICropFamily {
  id: string;
  label: string;
  varietyCount: number;
}

@Component({
  selector: 'dashboard-crop-print-export',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './crop-print-export.component.html',
  styleUrl: './crop-print-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropPrintExportComponent {
  private deploymentService = inject(DeploymentDashboardService);
  private cropService = inject(CropInformationService);
  private printService = inject(CropProbabilityPrintService);

  public locations = computed(() => {
    const locationData = this.deploymentService.activeDeploymentLocationData();
    if (!locationData) return [];
    return getDeepestLocations(locationData).sort((a, b) => a.label.localeCompare(b.label));
  });

  /** Locations with no exportable data (no station, requirements or probabilities) */
  public unavailableIds = computed(() => {
    const unavailable = new Set<string>();
    const downscaledByLocation = arrayToHashmap(this.cropService.downscaledData(), 'location_id');
    const stationDataByStation = arrayToHashmap(this.cropService.stationData(), 'station_id');
    for (const loc of this.locations()) {
      const row = downscaledByLocation[loc.id] as
        | { station_id?: string | null; water_requirements?: Record<string, unknown> }
        | undefined;
      const water = row?.water_requirements;
      if (!row || !row.station_id || !water || Object.keys(water).length === 0) {
        unavailable.add(loc.id);
        continue;
      }
      const stationData = stationDataByStation[row.station_id] as
        | { crop_probability_data?: unknown; annual_rainfall_data?: unknown }
        | undefined;
      const probs = stationData?.crop_probability_data;
      const rainfall = stationData?.annual_rainfall_data;
      if (!Array.isArray(probs) || probs.length === 0 || !Array.isArray(rainfall) || rainfall.length === 0) {
        unavailable.add(loc.id);
      }
    }
    return unavailable;
  });

  /** Districts grouped by parent province (single group when country has one tier) */
  public locationGroups = computed<ILocationGroup[]>(() => {
    const unavailable = this.unavailableIds();
    const groups = new Map<string, ILocationGroup>();
    for (const loc of this.locations()) {
      const groupId = loc.parentId || 'all';
      if (!groups.has(groupId)) {
        groups.set(groupId, { id: groupId, label: loc.parentLabel || 'Locations', districts: [] });
      }
      groups.get(groupId)?.districts.push({ id: loc.id, label: loc.label, available: !unavailable.has(loc.id) });
    }
    return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
  });

  public languageOptions = computed(() => {
    const countryCode = this.deploymentService.activeDeploymentCountry();
    const locales = LOCALES_DATA.filter((v) => v.country_code === countryCode && v.language_code !== 'en');
    return [LOCALES_DATA_HASHMAP['global_en'], ...locales];
  });

  /** Crop families present in the master data, with variety counts */
  public cropFamilies = computed<ICropFamily[]>(() => {
    const byCrop = new Map<string, Set<string>>();
    for (const row of this.cropService.cropData()) {
      if (!byCrop.has(row.crop)) byCrop.set(row.crop, new Set());
      byCrop.get(row.crop)?.add(row.variety);
    }
    return [...byCrop.entries()]
      .map(([id, varieties]) => ({
        id,
        label: CROPS_DATA_HASHMAP[id as keyof typeof CROPS_DATA_HASHMAP]?.label || id,
        varietyCount: varieties.size,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  public selectedLocationIds = signal<string[]>([]);
  public selectedLanguageCodes = signal<string[]>(['global_en']);
  public selectedCropIds = signal<string[]>([]);

  public exporting = signal(false);
  public singleExportingId = signal<string | null>(null);
  public progressDone = signal(0);
  public progressTotal = signal(0);
  public stage = signal<PrintExportStage | 'idle'>('idle');
  public lastResult = signal('');
  public failures = signal<{ file: string; error: string }[]>([]);

  public availableCount = computed(() => this.locations().length - this.unavailableIds().size);
  public estimatedFiles = computed(() => this.selectedLocationIds().length * this.selectedLanguageCodes().length);
  public canExport = computed(
    () =>
      !this.exporting() &&
      !this.singleExportingId() &&
      this.selectedLocationIds().length > 0 &&
      this.selectedCropIds().length > 0,
  );

  public get busy(): boolean {
    return this.exporting() || !!this.singleExportingId();
  }

  public statusText = computed(() => {
    const stage = this.stage();
    const done = this.progressDone();
    const total = this.progressTotal();
    switch (stage) {
      case 'preparing':
        return total > 0 ? `Loading data for ${total} file(s)…` : 'Loading data…';
      case 'generating':
        return `Generating Word ${done}/${total}…`;
      case 'converting':
        return `Converting to PDF ${done}/${total}…`;
      case 'zipping':
        return 'Compressing zip…';
      default:
        return '';
    }
  });

  public get progressIndeterminate(): boolean {
    return this.progressTotal() === 0 || this.stage() === 'preparing' || this.stage() === 'zipping';
  }

  constructor() {
    // Default to all available locations and all crop families once async data resolves
    effect(() => {
      const locs = this.locations();
      if (locs.length > 0 && this.selectedLocationIds().length === 0 && !this.hasInitialisedSelection) {
        this.hasInitialisedSelection = true;
        this.selectedLocationIds.set(locs.filter((l) => !this.unavailableIds().has(l.id)).map((l) => l.id));
      }
    });
    effect(() => {
      const families = this.cropFamilies();
      if (families.length > 0 && this.selectedCropIds().length === 0 && !this.hasInitialisedCrops) {
        this.hasInitialisedCrops = true;
        this.selectedCropIds.set(families.map((f) => f.id));
      }
    });
  }

  private hasInitialisedSelection = false;
  private hasInitialisedCrops = false;

  public isCropSelected(id: string): boolean {
    return this.selectedCropIds().includes(id);
  }

  public toggleCrop(id: string, checked: boolean) {
    this.selectedCropIds.update((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));
  }

  public toggleAllCrops(selectAll: boolean) {
    this.selectedCropIds.set(selectAll ? this.cropFamilies().map((f) => f.id) : []);
  }

  public isLocationSelected(id: string): boolean {
    return this.selectedLocationIds().includes(id);
  }

  public toggleLocation(id: string, checked: boolean) {
    this.selectedLocationIds.update((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));
  }

  public toggleAllLocations(selectAll: boolean) {
    this.selectedLocationIds.set(
      selectAll
        ? this.locations()
            .filter((l) => !this.unavailableIds().has(l.id))
            .map((l) => l.id)
        : [],
    );
  }

  public groupSelectedCount(group: ILocationGroup): number {
    const selected = this.selectedLocationIds();
    return group.districts.filter((d) => selected.includes(d.id)).length;
  }

  public groupSelectableCount(group: ILocationGroup): number {
    return group.districts.filter((d) => d.available).length;
  }

  public isGroupChecked(group: ILocationGroup): boolean {
    const selectable = group.districts.filter((d) => d.available);
    return selectable.length > 0 && selectable.every((d) => this.selectedLocationIds().includes(d.id));
  }

  public isGroupIndeterminate(group: ILocationGroup): boolean {
    const count = this.groupSelectedCount(group);
    return count > 0 && !this.isGroupChecked(group);
  }

  public toggleGroup(group: ILocationGroup, checked: boolean) {
    const ids = group.districts.filter((d) => d.available).map((d) => d.id);
    this.selectedLocationIds.update((prev) =>
      checked ? [...new Set([...prev, ...ids])] : prev.filter((v) => !ids.includes(v)),
    );
  }

  public languageLabel(code: string): string {
    return LOCALES_DATA_HASHMAP[code as keyof typeof LOCALES_DATA_HASHMAP]?.language_label || code;
  }

  public exportBulk(format: CropPrintFormat) {
    if (!this.canExport()) return;
    this.runExport(this.selectedLocationIds(), null, format);
  }

  public exportSingle(locationId: string, format: CropPrintFormat) {
    if (this.busy) return;
    this.runExport([locationId], locationId, format);
  }

  private async runExport(locationIds: string[], singleId: string | null, format: CropPrintFormat) {
    const isSingle = singleId !== null;
    if (isSingle) this.singleExportingId.set(singleId);
    else this.exporting.set(true);
    this.stage.set('preparing');
    this.progressDone.set(0);
    this.progressTotal.set(locationIds.length * Math.max(this.selectedLanguageCodes().length, 1));
    this.lastResult.set('');
    this.failures.set([]);
    try {
      await this.cropService.ready();
      const { files, skipped, failed } = await this.printService.exportPrint({
        locationIds,
        languageCodes: this.selectedLanguageCodes(),
        cropFamilies: this.selectedCropIds(),
        format,
        onProgress: (done, total, stage) => {
          this.progressDone.set(done);
          this.progressTotal.set(total);
          this.stage.set(stage);
        },
      });
      this.failures.set(failed);
      this.lastResult.set(
        files > 0
          ? `Exported ${files} file(s)${skipped > 0 ? `, skipped ${skipped} with no data` : ''}${failed.length > 0 ? `, ${failed.length} failed` : ''}`
          : 'No files exported - no locations with data',
      );
    } catch (e) {
      this.lastResult.set(`Export failed: ${(e as Error).message || e}`);
    } finally {
      if (isSingle) this.singleExportingId.set(null);
      else this.exporting.set(false);
      this.stage.set('idle');
    }
  }
}
