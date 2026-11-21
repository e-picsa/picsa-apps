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
import {
  getSelectionLabel,
  IGeolocationData,
  ILocationSelection,
  isSelectionComplete,
  resolveLocationForTool,
} from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { TourService } from '@picsa/shared/services/core/tour';

import { CropProbabilityTableComponent } from '../../components/crop-probability-table/crop-probability-table.component';
import { PROBABILITY_TABLE_DATA } from '../../data';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IProbabilityTable, IStationCropData } from '../../models';
import { filterLocationsToProbabilityTables, getTableLocationId } from '../../utils/location-filter.utils';

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
  public locationSelected = this.configService.activeLocationSelection;

  /** Whether the user has at least one location tier selected for this country */
  public hasLocation = computed(() => Object.keys(this.locationSelected()).length > 0);

  /** Display label for the selected location, used when no probability table matches */
  public selectedLocationLabel = computed(() => {
    const country = this.countryCode();
    if (!country) return undefined;
    return getSelectionLabel(country as ICountryCode, this.locationSelected());
  });

  public locationReady = computed(() => {
    const country = this.countryCode();
    if (!country) return false;
    return isSelectionComplete(country as ICountryCode, this.locationSelected(), 'cropProbability');
  });

  public locationOverlayOpen = signal(false);
  public selectedTableId = signal<string | undefined>(undefined);
  public tableStationData = signal<IStationCropData[] | undefined>(undefined);

  /** All probability sheets matching the user's resolved cropProbability location (0, 1, or N for multi-station districts) */
  public matchingTables = computed<IProbabilityTable[]>(() => {
    const countryCode = this.countryCode();
    if (!countryCode) return [];
    const { locations } = resolveLocationForTool(
      countryCode as ICountryCode,
      this.locationSelected(),
      'cropProbability',
    );
    if (locations.length !== 1) return [];
    const targetId = locations[0].id;
    return (PROBABILITY_TABLE_DATA[countryCode] ?? []).filter((t) => getTableLocationId(t) === targetId);
  });

  public tableStationMeta = computed<IProbabilityTable | undefined>(() => {
    const matches = this.matchingTables();
    if (matches.length === 0) return undefined;
    const pickedId = this.selectedTableId();
    return matches.find((t) => t.id === pickedId) ?? matches[0];
  });

  constructor() {
    effect((onCleanup) => {
      const meta = this.tableStationMeta();
      if (!meta) {
        this.tableStationData.set(undefined);
        return;
      }
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      meta.data().then((data) => {
        if (!cancelled) {
          this.tableStationData.set(data);
        }
      });
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

  public handleLocationConfirmed(location: ILocationSelection) {
    this.selectedTableId.set(undefined);
    this.configService.setLocationSelection(location);
    this.locationOverlayOpen.set(false);
  }

  /** Pure delegation — shared per-country geo data must never be mutated */
  public locationModifier(data: IGeolocationData, country_code: string): IGeolocationData {
    const allData: IProbabilityTable[] = PROBABILITY_TABLE_DATA[country_code] || [];
    return filterLocationsToProbabilityTables(data, allData);
  }

  /** One-time import of pre-overlay saved query/localStorage locations into user settings */
  private importLegacyLocation() {
    if (this.locationReady() || this.hasLocation()) return;
    const { locationId } = this.route.snapshot.queryParams as IQueryParams;
    const legacyId = locationId ?? localStorage.getItem(STORED_LOCATION_FIELD) ?? undefined;
    if (!legacyId) return;
    const selection = this.resolveLegacyTableSelection(legacyId);
    if (selection) {
      this.configService.setLocationSelection(selection);
      this.locationOverlayOpen.set(false);
      localStorage.removeItem(STORED_LOCATION_FIELD);
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  private resolveLegacyTableSelection(locationId: string): ILocationSelection | undefined {
    const country = this.countryCode();
    if (!country) return undefined;
    const tables = PROBABILITY_TABLE_DATA[country] ?? [];
    const entry = tables.find((v) => v.id === locationId || v.id.endsWith(`/${locationId}`));
    if (!entry) return undefined;
    const leafId = getTableLocationId(entry);
    const [parentId] = entry.id.includes('/') ? entry.id.split('/') : [undefined];
    return parentId ? { province: parentId, district: leafId } : { district: leafId };
  }

  protected readonly STRINGS = STRINGS;
}
