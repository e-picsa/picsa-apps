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
import { getGeoLocationData, getLocationSlots, IGeolocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { TourService } from '@picsa/shared/services/core/tour';
import { isEqual } from '@picsa/utils/object.utils';

import { CropProbabilityTableComponent } from '../../components/crop-probability-table/crop-probability-table.component';
import { PROBABILITY_TABLE_DATA } from '../../data';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IProbabilityTable, IStationCropData } from '../../models';

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

  public locationReady = computed(() => {
    const location = this.locationSelected();
    const country = this.countryCode();
    if (!country || !location) return false;
    const geoData = getGeoLocationData(country as ICountryCode);
    // multi-tier countries require both top and sublocation segments (stored at indexes 4 and 5)
    if (getLocationSlots(geoData).length > 1) {
      return !!location[4] && !!location[5];
    }
    return !!location[4];
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
    const locationId = this.locationId();
    if (countryCode && locationId) {
      // Handle case where zm excludes admin_4 from param but may have additional admin_5 sublocation
      return PROBABILITY_TABLE_DATA[countryCode]?.find((v) => v.id === locationId || v.id.endsWith(`/${locationId}`));
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

    // Auto-open location overlay if location is not set when entering tool
    effect(() => {
      if (!this.locationReady()) {
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

  /** Modify locations to only include values that have probability data */
  public locationModifier(data: IGeolocationData, country_code: string): IGeolocationData {
    const allData: IProbabilityTable[] = PROBABILITY_TABLE_DATA[country_code] || [];
    const slots = getLocationSlots(data);
    // track table ids per level - ids use format parent[/child[--sublocation]]
    const availableByLevel: string[][] = slots.map(() => []);
    for (const entry of allData) {
      entry.id.split('/').forEach((segment, i) => {
        if (i < slots.length) availableByLevel[i].push(segment.split('--')[0]);
      });
    }

    // filter each level to only include those with child probability tables available
    slots.forEach((slot, i) => {
      const locations = data[slot]?.locations ?? [];
      (data[slot] as { locations: { id: string }[] }).locations = locations.filter((v) =>
        availableByLevel[i].includes(v.id),
      );
    });

    if (slots.length > 1) {
      const deepSlot = slots[slots.length - 1];
      const parentSlot = slots[slots.length - 2];
      // HACK - data can have multiple tables in same sublocation, e.g.
      // `southern/mazabuka--kafue-polder` and `southern/mazabuka--magoye-agromet`
      allData.forEach((entry) => {
        const segments = entry.id.split('/');
        const [, sublocation] = (segments[1] || '').split('--');
        if (sublocation) {
          (data[deepSlot]?.locations as unknown[]).push({
            id: entry.id,
            label: entry.label,
            [parentSlot]: segments[0],
          });
        }
      });
    } else {
      // HACK - single-tier geo data but crop probability tables include multiple per
      // location so create entries to use in filter
      const additionalLocations = allData.map(({ id, label }) => {
        const [parent, child] = id.split('/');
        return { id: child ?? parent, admin_4: parent, label };
      });
      data.admin_5 = { label: 'Location', locations: additionalLocations };
    }
    return data;
  }

  /** One-time import of pre-overlay saved locations into user settings */
  private importLegacyLocation() {
    if (this.locationReady()) return;
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
