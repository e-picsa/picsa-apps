import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { CropInformationService } from '../../../../services';
import { groupDuplicateVarieties, ICropVarietyPair, IDuplicateGroup, normalizeName } from './duplicate-crops.utils';

@Component({
  selector: 'dashboard-crop-duplicate-crops',
  imports: [MatButtonModule, MatIconModule, PicsaDataTableComponent],
  templateUrl: './duplicate-crops.component.html',
  styleUrl: './duplicate-crops.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Groups crop varieties normalizing to identical alphanumeric strings so that
 * spelling variants (e.g. PHB-30-D79 vs PHB-30D79) can be reconciled.
 */
export class CropDuplicateCropsComponent implements AfterViewInit {
  private service = inject(CropInformationService);
  private notificationService = inject(PicsaNotificationService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('actionsTemplate') private actionsTemplate!: TemplateRef<{ $implicit: unknown; row: IDuplicateGroup }>;

  /** Column templates bound once after view init (avoids recreating the map on every change detection cycle) */
  public valueTemplates: Record<string, TemplateRef<{ $implicit: unknown; row: IDuplicateGroup }>> = {};

  public ngAfterViewInit() {
    this.valueTemplates = { actions: this.actionsTemplate };
    this.cdr.markForCheck();
  }

  /** All crop/variety pairs from baseline and downscaled tables */
  private allPairs = computed<ICropVarietyPair[]>(() => {
    const pairs: ICropVarietyPair[] = [];

    // From crop_data (baseline definitions)
    for (const d of this.service.cropData()) {
      pairs.push({
        crop: normalizeName(d.crop),
        variety: normalizeName(d.variety),
        source: 'crop_data',
        original_crop: d.crop,
        original_variety: d.variety,
      });
    }

    // From crop_data_downscaled water requirement keys (with affected locations)
    for (const d of this.service.downscaledData()) {
      const waterReqs = d.water_requirements as Record<string, Record<string, number>>;
      for (const [crop, varieties] of Object.entries(waterReqs ?? {})) {
        for (const variety of Object.keys(varieties)) {
          pairs.push({
            crop: normalizeName(crop),
            variety: normalizeName(variety),
            source: 'crop_data_downscaled',
            original_crop: crop,
            original_variety: variety,
            location_id: d.location_id,
          });
        }
      }
    }

    return pairs;
  });

  /** Duplicate groups keyed by normalized crop/variety, counting only distinct spellings */
  public duplicateGroups = computed<IDuplicateGroup[]>(() => groupDuplicateVarieties(this.allPairs()));

  /** Summary stats */
  public stats = computed(() => {
    const groups = this.duplicateGroups();
    return {
      total_pairs: this.allPairs().length,
      duplicate_groups: groups.length,
      total_variants: groups.reduce((sum, g) => sum + g.variant_count, 0),
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['crop', 'normalized_variety', 'variant_count', 'variants', 'sources', 'locations', 'actions'],
    paginatorSizes: [50, 100],
    search: true,
    sort: { id: 'crop', start: 'asc' },
    formatHeader: (v) => {
      const headerMap: Record<string, string> = {
        crop: 'Crop Name',
        normalized_variety: 'Normalized Variety Key',
        variant_count: 'Variant Count',
        variants: 'Spelled Variants Found',
        sources: 'Sources Affected',
        locations: 'Downscaled Locations',
        actions: 'Actions',
      };
      return headerMap[v] || formatHeaderDefault(v);
    },
    exportFilename: 'duplicate-crops.csv',
  };

  /** Copy the variant spellings of a group to clipboard */
  public async copyVariants(group: IDuplicateGroup) {
    try {
      await navigator.clipboard.writeText(group.variants);
      this.notificationService.showSuccessNotification('Variants copied to clipboard');
    } catch (error) {
      console.error('Failed to copy variants', error);
      this.notificationService.showErrorNotification('Failed to copy variants');
    }
  }
}
