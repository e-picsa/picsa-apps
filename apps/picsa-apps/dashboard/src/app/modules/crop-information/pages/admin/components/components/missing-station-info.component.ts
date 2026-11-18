import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild } from '@angular/core';
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
  bounds_tooltip: string;
  data_updated: string;
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

function buildBoundsTooltip(
  b: IStationLookupBounds,
  differs: { days: boolean; water: boolean; plant: boolean },
): string {
  const daysLine = `Length: ${b.minDays}-${b.maxDays}d | ${b.daysStep ?? '?'}d${differs.days ? ' (differs)' : ''}`;
  const waterLine = `Water: ${b.minWater}-${b.maxWater}mm | ${b.waterStep ?? '?'}mm${differs.water ? ' (differs)' : ''}`;
  const dateLine = `Date: ${formatTooltipDate(b.minPlantDateLabel)} - ${formatTooltipDate(b.maxPlantDateLabel)} | ${b.plantDayStep ?? '?'}d${differs.plant ? ' (differs)' : ''}`;
  return `${daysLine}\n${waterLine}\n${dateLine}`;
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

  private readonly boundsTemplate =
    viewChild<TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>>('boundsTemplate');

  public valueTemplates = computed(() => {
    const bounds = this.boundsTemplate();
    const map: Record<string, TemplateRef<{ $implicit: unknown; row: IStationProbabilityStatus }>> = {};
    if (bounds) map['probability_bounds'] = bounds;
    return map;
  });

  public tableFilter = signal<StationBoundsFilter>('all');

  /** One row per deployment station with lookup bounds consistency status */
  public stationStatuses = computed<IStationProbabilityStatus[]>(() => {
    const stationDataHashmap = arrayToHashmap(this.service.stationData(), 'station_id');
    const parsed = this.service.stations().map((station) => {
      const stationId = station.id || station.station_id;
      const stationData = stationId ? stationDataHashmap[stationId] : undefined;
      const lookupBounds = extractStationLookupBounds(stationData?.crop_probability_data as ICropSuccessEntry[]);
      return { station, stationData, lookupBounds };
    });

    const sigs = parsed
      .map((p) => (p.lookupBounds ? formatBoundsSignature(p.lookupBounds) : null))
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const majorityDays = findMajoritySignature(sigs.map((s) => s.days));
    const majorityWater = findMajoritySignature(sigs.map((s) => s.water));
    const majorityPlant = findMajoritySignature(sigs.map((s) => s.plant));

    return parsed
      .map(({ station, stationData, lookupBounds }) => {
        const has_probabilities = lookupBounds !== null;
        const updated = (stationData?.updated_at || '').slice(0, 10);

        let probability_bounds: StationBoundsStatus = 'missing';
        let has_inconsistent_bounds = false;
        let bounds_tooltip = 'No crop probability data';

        if (lookupBounds) {
          const sig = formatBoundsSignature(lookupBounds);
          const differs = {
            days: majorityDays !== null && sig.days !== majorityDays,
            water: majorityWater !== null && sig.water !== majorityWater,
            plant: majorityPlant !== null && sig.plant !== majorityPlant,
          };
          has_inconsistent_bounds = differs.days || differs.water || differs.plant;
          probability_bounds = has_inconsistent_bounds ? 'inconsistent' : 'consistent';
          bounds_tooltip = buildBoundsTooltip(lookupBounds, differs);
        }

        return {
          station_name: station.station_name || station.station_id,
          district: station.district || 'Unknown',
          has_probabilities,
          has_inconsistent_bounds,
          probability_bounds,
          bounds_tooltip,
          data_updated: has_probabilities ? updated : '—',
        };
      })
      .sort((a, b) => a.station_name.localeCompare(b.station_name));
  });

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
