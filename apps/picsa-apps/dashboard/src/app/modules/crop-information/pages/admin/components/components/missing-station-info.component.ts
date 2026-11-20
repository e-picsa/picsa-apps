import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';

import { DashboardMaterialModule } from '../../../../../../material.module';
import type { ICropSuccessEntry } from '../../../../../climate/types';
import { CropInformationService } from '../../../../services';
import { extractStationLookupBounds, type IStationLookupBounds } from '../../../../utils/crop-qc.utils';

export type StationBoundsFilter = 'all' | 'missing_data' | 'inconsistent';
export type StationBoundsStatus = 'consistent' | 'inconsistent' | 'missing';

interface IStationProbabilityStatus {
  station_name: string;
  district: string;
  has_probabilities: boolean;
  has_inconsistent_bounds: boolean;
  probability_bounds: StationBoundsStatus;
  data_updated: string;
  station_bounds: IStationLookupBounds | null;
  differs: { days: boolean; water: boolean; plant: boolean };
}

function findMajoritySignature(signatures: string[]): string | null {
  if (signatures.length === 0) return null;
  const counts = new Map<string, number>();
  for (const sig of signatures) {
    counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function formatBoundsSignature(b: IStationLookupBounds) {
  return {
    days: `${b.minDays}-${b.maxDays}:${b.daysStep ?? ''}`,
    water: `${b.minWater}-${b.maxWater}:${b.waterStep ?? ''}`,
    plant: `${b.minPlantDay}-${b.maxPlantDay}:${b.plantDayStep ?? ''}`,
  };
}

function formatTooltipDate(label: string): string {
  return label.replaceAll('-', ' ');
}

/** Split a bound into main value and step shown on the next line */
function boundParts(main: string, step: number | null, unit: string): { main: string; step: string | null } {
  return { main, step: step != null ? `step ${step}${unit}` : null };
}

@Component({
  selector: 'dashboard-crop-missing-station-info',
  imports: [DashboardMaterialModule, PicsaDataTableComponent],
  templateUrl: './missing-station-info.component.html',
  styleUrl: './missing-station-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Tracks deployment station crop probability lookup bounds consistency
 * (crop length, water requirement, planting dates) against the country majority.
 */
export class CropMissingStationInfoComponent {
  private readonly service = inject(CropInformationService);
  private readonly dialog = inject(MatDialog);

  private readonly boundsTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>>('boundsTemplate');
  private readonly boundsDialogTemplate = viewChild.required<TemplateRef<unknown>>('boundsDialogTemplate');

  public valueTemplates = computed(() => {
    const bounds = this.boundsTemplate();
    const map: Record<string, TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>> = {};
    if (bounds) map['probability_bounds'] = bounds;
    return map;
  });

  public tableFilter = signal<StationBoundsFilter>('all');
  private readonly selectedStation = signal<IStationProbabilityStatus | null>(null);

  /** Parsed bounds per station, shared by status rows and majority summary */
  private parsedBounds = computed(() => {
    const stationDataHashmap = arrayToHashmap(this.service.stationData(), 'station_id');
    return this.service.stations().map((station) => {
      const stationId = station.id || station.station_id;
      const stationData = stationId ? stationDataHashmap[stationId] : undefined;
      const lookupBounds = extractStationLookupBounds(stationData?.crop_probability_data as ICropSuccessEntry[]);
      return { station, stationData, lookupBounds };
    });
  });

  /** Single majority computation reused by status rows and the dialog */
  private majority = computed(() => {
    const parsed = this.parsedBounds();
    const sigs = parsed
      .map((p) => (p.lookupBounds ? formatBoundsSignature(p.lookupBounds) : null))
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const days = findMajoritySignature(sigs.map((s) => s.days));
    const water = findMajoritySignature(sigs.map((s) => s.water));
    const plant = findMajoritySignature(sigs.map((s) => s.plant));
    const findRef = (key: 'days' | 'water' | 'plant', sig: string | null) =>
      sig
        ? (parsed.find((p) => p.lookupBounds && formatBoundsSignature(p.lookupBounds)[key] === sig)?.lookupBounds ??
          null)
        : null;
    return {
      days,
      water,
      plant,
      daysRef: findRef('days', days),
      waterRef: findRef('water', water),
      plantRef: findRef('plant', plant),
      daysCount: days ? sigs.filter((s) => s.days === days).length : 0,
      waterCount: water ? sigs.filter((s) => s.water === water).length : 0,
      plantCount: plant ? sigs.filter((s) => s.plant === plant).length : 0,
      total: sigs.length,
    };
  });

  /** One row per deployment station with lookup bounds consistency status */
  public stationStatuses = computed<IStationProbabilityStatus[]>(() => {
    const parsed = this.parsedBounds();
    const { days, water, plant } = this.majority();

    return parsed
      .map(({ station, stationData, lookupBounds }) => {
        const has_probabilities = lookupBounds !== null;
        const updated = (stationData?.updated_at || '').slice(0, 10);

        let probability_bounds: StationBoundsStatus = 'missing';
        let has_inconsistent_bounds = false;
        let differs = { days: false, water: false, plant: false };

        if (lookupBounds) {
          const sig = formatBoundsSignature(lookupBounds);
          differs = {
            days: days !== null && sig.days !== days,
            water: water !== null && sig.water !== water,
            plant: plant !== null && sig.plant !== plant,
          };
          has_inconsistent_bounds = differs.days || differs.water || differs.plant;
          probability_bounds = has_inconsistent_bounds ? 'inconsistent' : 'consistent';
        }

        return {
          station_name: station.station_name || station.station_id,
          district: station.district || 'Unknown',
          has_probabilities,
          has_inconsistent_bounds,
          probability_bounds,
          data_updated: has_probabilities ? updated : '—',
          station_bounds: lookupBounds,
          differs,
        };
      })
      .sort((a, b) => a.station_name.localeCompare(b.station_name));
  });

  /** Dialog-scoped standard-vs-station comparison, null when no selection */
  public dialogComparison = computed(() => {
    const selected = this.selectedStation();
    if (!selected) return null;
    const m = this.majority();
    if (!selected.station_bounds) return { station: selected, total: m.total, rows: [] };
    const b = selected.station_bounds;
    const plantLabel = (ref: IStationLookupBounds | null) =>
      ref ? `${formatTooltipDate(ref.minPlantDateLabel)} – ${formatTooltipDate(ref.maxPlantDateLabel)}` : '—';
    const stationDays = boundParts(`${b.minDays}–${b.maxDays}d`, b.daysStep, 'd');
    const standardDays = m.daysRef
      ? boundParts(`${m.daysRef.minDays}–${m.daysRef.maxDays}d`, m.daysRef.daysStep, 'd')
      : { main: '—', step: null };
    const stationWater = boundParts(`${b.minWater}–${b.maxWater}mm`, b.waterStep, 'mm');
    const standardWater = m.waterRef
      ? boundParts(`${m.waterRef.minWater}–${m.waterRef.maxWater}mm`, m.waterRef.waterStep, 'mm')
      : { main: '—', step: null };
    const stationPlant = boundParts(plantLabel(b), b.plantDayStep, 'd');
    const standardPlant = m.plantRef
      ? boundParts(plantLabel(m.plantRef), m.plantRef.plantDayStep, 'd')
      : { main: '—', step: null };
    const rows = [
      {
        label: 'Crop Length',
        standard: standardDays.main,
        standardStep: standardDays.step,
        station: stationDays.main,
        stationStep: stationDays.step,
        differs: selected.differs.days,
        standardCount: m.daysCount,
      },
      {
        label: 'Water Requirement',
        standard: standardWater.main,
        standardStep: standardWater.step,
        station: stationWater.main,
        stationStep: stationWater.step,
        differs: selected.differs.water,
        standardCount: m.waterCount,
      },
      {
        label: 'Planting Dates',
        standard: standardPlant.main,
        standardStep: standardPlant.step,
        station: stationPlant.main,
        stationStep: stationPlant.step,
        differs: selected.differs.plant,
        standardCount: m.plantCount,
      },
    ];
    return { station: selected, total: m.total, rows };
  });

  public openBoundsDialog(row: IStationProbabilityStatus) {
    this.selectedStation.set(row);
    const ref = this.dialog.open(this.boundsDialogTemplate(), { width: '620px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(() => this.selectedStation.set(null));
  }

  /** Summary stats */
  public stats = computed(() => {
    const all = this.stationStatuses();
    return {
      total: all.length,
      withoutData: all.filter((s) => !s.has_probabilities).length,
      inconsistent: all.filter((s) => s.has_inconsistent_bounds).length,
    };
  });

  public displayedRows = computed(() => {
    const rows = this.stationStatuses();
    const filter = this.tableFilter();
    if (filter === 'missing_data') return rows.filter((r) => !r.has_probabilities);
    if (filter === 'inconsistent') return rows.filter((r) => r.has_inconsistent_bounds);
    return rows;
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['station_name', 'district', 'probability_bounds', 'data_updated'],
    paginatorSizes: [50, 100],
    search: true,
    sort: { id: 'station_name', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        station_name: 'Station Name',
        district: 'District',
        probability_bounds: 'Probability Bounds',
        data_updated: 'Data Updated',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'stations-crop-probability-bounds.csv',
  };
}
