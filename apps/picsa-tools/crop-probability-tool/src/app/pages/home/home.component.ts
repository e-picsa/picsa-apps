import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { getGeoLocationData, getLocationLabel, IGeolocationData, isLocationComplete } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { TourService } from '@picsa/shared/services/core/tour';
import { isEqual } from '@picsa/utils/object.utils';

import { CropProbabilityTableComponent } from '../../components/crop-probability-table/crop-probability-table.component';
import { PROBABILITY_TABLE_DATA } from '../../data';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IProbabilityTable, IStationCropData } from '../../models';
import { filterLocationsToProbabilityTables } from '../../utils/location-filter.utils';

interface IQueryParams {
  /** id of active selected station */
  locationId?: string;
}

/** Legacy single-segment station id, superseded by user settings location */
const STORED_LOCATION_FIELD = 'picsa_crop_tool_location';

const STRINGS = {
  SelectStation: translateMarker('Please select a location to view crop information'),
};

@Component({
  selector: 'crop-probability-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [PicsaFormsModule, CropProbabilityTableComponent, MatButtonModule, MatIcon, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tourService = inject(TourService);
  private configService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);

  private readonly headerCenterPortal = viewChild<TemplateRef<unknown>>('headerCenterPortal');
  private readonly headerEndPortal = viewChild<TemplateRef<unknown>>('headerEndPortal');
  public readonly tableComponent = viewChild(CropProbabilityTableComponent);

  public countryCode = computed(() => this.configService.userSettings().country_code);
  public locationSelected = computed(() => this.configService.userSettings().location, { equal: isEqual });

  /** Whether the user has at least one administrative location segment selected */
  public hasLocation = computed(() => Boolean(this.locationSelected()?.some(Boolean)));

  /** Display label for the selected district, used when no probability table matches */
  public selectedLocationLabel = computed(() => {
    const country = this.countryCode();
    if (!country) return undefined;
    return getLocationLabel(getGeoLocationData(country as ICountryCode), this.locationSelected());
  });

  public locationReady = computed(() => {
    const country = this.countryCode();
    if (!country) return false;
    return isLocationComplete(getGeoLocationData(country as ICountryCode), this.locationSelected());
  });

  /** Deepest selected location segment, used to match probability tables */
  public locationId = computed(() => {
    const location = this.locationSelected();
    return location[5] ?? location[4];
  });

  public locationOverlayOpen = signal(false);

  public tableStationData = signal<IStationCropData[] | undefined>(undefined);

  public tableStationMeta = computed<IProbabilityTable | undefined>(() => {
    const countryCode = this.countryCode();
    const location = this.locationSelected();
    const parentId = location[4];
    const sublocationId = location[5];
    const locationId = this.locationId();

    if (!countryCode || !locationId) return undefined;
    const tables = PROBABILITY_TABLE_DATA[countryCode] ?? [];

    // 1. Exact match on full hierarchy path (e.g. 'central/chibombo' or 'masvingo/masvingo')
    if (parentId && sublocationId) {
      const fullPath = `${parentId}/${sublocationId}`;
      const exact = tables.find(
        (v) =>
          v.id === fullPath ||
          v.id === sublocationId ||
          v.id.endsWith(`/${sublocationId}`) ||
          v.id.includes(`/${sublocationId}--`),
      );
      if (exact) return exact;
    }

    // 2. Match on deepest segment id (or suffix)
    const directMatch = tables.find(
      (v) => v.id === locationId || v.id.endsWith(`/${locationId}`) || v.id.includes(`/${locationId}--`),
    );
    if (directMatch) return directMatch;

    // 3. Fallback: if parent is selected (e.g. from climate tool with no sublocation),
    // or if the sublocation has no specific table, fall back to the first available table under that parent
    if (parentId) {
      const parentMatch = tables.find((v) => v.id.startsWith(`${parentId}/`));
      if (parentMatch) return parentMatch;
    }

    return undefined;
  });

  constructor() {
    effect(async () => {
      const meta = this.tableStationMeta();
      if (meta) {
        // load data from meta definition
        const data = await meta.data();
        this.tableStationData.set(data);
      }
    });

    // Auto-open location overlay only if no location has been selected yet
    effect(() => {
      if (!this.hasLocation()) {
        this.locationOverlayOpen.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.importLegacyLocation();
    this.tourService.registerTour('cropProbabilityTable', CROP_PROBABILITY_TABLE_TOUR);
    this.tourService.registerTour('cropProbabilitySelect', CROP_PROBABILITY_SELECT_TOUR);
  }

  ngAfterViewInit() {
    const centerPortal = this.headerCenterPortal();
    const endPortal = this.headerEndPortal();
    this.componentsService.patchHeader({
      cdkPortalCenter: centerPortal ? new TemplatePortal(centerPortal, this.viewContainer) : undefined,
      cdkPortalEnd: endPortal ? new TemplatePortal(endPortal, this.viewContainer) : undefined,
    });
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({
      cdkPortalCenter: undefined,
      cdkPortalEnd: undefined,
    });
  }

  public shareTable() {
    return this.tableComponent()?.sharePicture();
  }

  public handleLocationConfirmed(location: (string | undefined)[]) {
    this.configService.updateUserSettings({ location });
    this.locationOverlayOpen.set(false);
  }

  /**
   * Modify locations to only include values that have probability data.
   * Pure delegation - the shared per-country geo data must never be mutated as the
   * filter re-runs every time the location overlay is opened.
   */
  public locationModifier(data: IGeolocationData, country_code: string): IGeolocationData {
    const allData: IProbabilityTable[] = PROBABILITY_TABLE_DATA[country_code] || [];
    return filterLocationsToProbabilityTables(data, allData);
  }

  /** One-time import of pre-overlay saved locations into user settings */
  private importLegacyLocation() {
    if (this.locationReady() || this.hasLocation()) return;
    const { locationId } = this.route.snapshot.queryParams as IQueryParams;
    const legacyId = locationId ?? localStorage.getItem(STORED_LOCATION_FIELD) ?? undefined;
    if (!legacyId) return;
    const location = this.resolveLocationArray(legacyId);
    if (location) {
      this.configService.updateUserSettings({ location });
      // Auto-open effect may have fired before import - close overlay as location now ready
      this.locationOverlayOpen.set(false);
      localStorage.removeItem(STORED_LOCATION_FIELD);
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  private resolveLocationArray(locationId: string): (string | undefined)[] | undefined {
    const country = this.countryCode();
    if (!country) return undefined;
    const tables = PROBABILITY_TABLE_DATA[country] ?? [];
    const entry = tables.find((v) => v.id === locationId || v.id.endsWith(`/${locationId}`));
    if (!entry) return undefined;
    const [admin_4, admin_5] = entry.id.split('/');
    // Station options with sublocations use the full table id as option value
    const admin5Value = entry.id.includes('--') ? entry.id : admin_5;
    return [undefined, undefined, country, undefined, admin_4, admin5Value];
  }

  protected readonly STRINGS = STRINGS;
}
