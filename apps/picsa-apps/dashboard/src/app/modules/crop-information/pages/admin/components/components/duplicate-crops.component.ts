import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { CropInformationService } from '../../../../services';
import { groupDuplicateVarieties, ICropVarietyPair, IDuplicateGroup, normalizeName } from './duplicate-crops.utils';

@Component({
  selector: 'dashboard-crop-duplicate-crops',
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PicsaDataTableComponent,
  ],
  templateUrl: './duplicate-crops.component.html',
  styleUrl: './duplicate-crops.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Groups crop varieties normalizing to identical alphanumeric strings so that
 * spelling variants (e.g. PHB-30-D79 vs PHB-30D79) can be reconciled.
 * Generic terms such as "local" can be excluded via the interactive whitelist.
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

  /** Whitelist of terms to exclude from duplicate detection (matched after normalization) */
  public whitelist = signal<string[]>(['local', 'local variety', 'local strain']);

  /** Input for adding new whitelist term */
  public newWhitelistTerm = signal('');

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

  /** Whitelist as normalized set for quick lookup */
  private whitelistSet = computed(() => new Set(this.whitelist().map((w) => normalizeName(w))));

  /** Duplicate groups keyed by normalized crop/variety, counting only distinct spellings */
  public duplicateGroups = computed<IDuplicateGroup[]>(() =>
    groupDuplicateVarieties(this.allPairs(), this.whitelist()),
  );

  /** Summary stats */
  public stats = computed(() => {
    const groups = this.duplicateGroups();
    const totalPairs = this.allPairs().length;
    const whitelistedCount = this.allPairs().filter((p) => this.whitelistSet().has(p.variety)).length;
    return {
      total_pairs: totalPairs,
      duplicate_groups: groups.length,
      total_variants: groups.reduce((sum, g) => sum + g.variant_count, 0),
      whitelisted: whitelistedCount,
    };
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['crop', 'normalized_variety', 'variant_count', 'variants', 'sources', 'locations', 'actions'],
    paginatorSizes: [10, 25, 50, 100],
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

  /** Add term to whitelist */
  public addToWhitelist() {
    const term = this.newWhitelistTerm().trim();
    if (!term) return;
    const normalized = normalizeName(term);
    if (!this.whitelist().some((w) => normalizeName(w) === normalized)) {
      this.whitelist.update((list) => [...list, term]);
    }
    this.newWhitelistTerm.set('');
  }

  /** Remove term from whitelist */
  public removeFromWhitelist(term: string) {
    this.whitelist.update((list) => list.filter((w) => w !== term));
  }

  /** Whitelist the first variant spelling so the whole duplicate group is excluded */
  public whitelistGroup(group: IDuplicateGroup) {
    const firstVariant = group.variants.split(', ')[0];
    if (!firstVariant) return;
    const normalized = normalizeName(firstVariant);
    if (!this.whitelist().some((w) => normalizeName(w) === normalized)) {
      this.whitelist.update((list) => [...list, firstVariant]);
    }
  }

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
