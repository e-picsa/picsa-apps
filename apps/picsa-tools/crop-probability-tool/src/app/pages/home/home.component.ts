import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
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
import { getGeoLocationData, IGeolocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaTourButton, TourService } from '@picsa/shared/services/core/tour';
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
  imports: [
    PicsaFormsModule,
    CropProbabilityTableComponent,
    MatButtonModule,
    MatIcon,
    PicsaTranslateModule,
    PicsaTourButton,
  ],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tourService = inject(TourService);
  private configService = inject(ConfigurationService);
  private componentsService = inject(PicsaCommonComponentsService);
  private viewContainer = inject(ViewContainerRef);

  private readonly headerCenterPortal = viewChild<TemplateRef<unknown>>('headerCenterPortal');

  public countryCode = computed(() => this.configService.userSettings().country_code);
  public locationSelected = computed(() => this.configService.userSettings().location, { equal: isEqual });

  public locationReady = computed(() => {
    const location = this.locationSelected();
    const country = this.countryCode();
    if (!country || !location) return false;
    const geoData = getGeoLocationData(country as ICountryCode);
    if (geoData.admin_5) {
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
    const portal = this.headerCenterPortal();
    if (portal) {
      this.componentsService.patchHeader({
        cdkPortalCenter: new TemplatePortal(portal, this.viewContainer),
      });
    }
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({ cdkPortalCenter: undefined });
  }

  public handleLocationConfirmed(location: (string | undefined)[]) {
    this.configService.updateUserSettings({ location });
    this.locationOverlayOpen.set(false);
  }

  /** Modify locations to only include values that have probability data */
  public locationModifier(data: IGeolocationData, country_code: string): IGeolocationData {
    const allData: IProbabilityTable[] = PROBABILITY_TABLE_DATA[country_code] || [];
    // track locations of existing probability tables, which have id in format admin_4/admin_5
    const availableLocations = { admin_4: [] as string[], admin_5: [] as string[] };
    for (const entry of allData) {
      const [admin_4, admin_5] = entry.id.split('/');
      availableLocations.admin_4.push(admin_4);
      availableLocations.admin_5.push(admin_5);
    }

    // filter admin_4 to only include those with child probability tables available
    data.admin_4.locations = data.admin_4.locations.filter((v) => availableLocations.admin_4.includes(v.id));

    // filter admin_5 to only include those with child probability tables available
    if (data.admin_5) {
      data.admin_5.locations = data.admin_5.locations.filter((v) => availableLocations.admin_5.includes(v.id));

      // HACK - zm data has multiple tables in same admin_5, e.g.
      // `southern/mazabuka--kafue-polder` and `southern/mazabuka--magoye-agromet`
      allData.forEach((entry) => {
        const [admin_4, admin_5_with_sublocation] = entry.id.split('/');
        const [admin_5, sublocation] = admin_5_with_sublocation.split('--');
        if (sublocation) {
          data.admin_5?.locations.push({ id: entry.id, label: entry.label, admin_4 });
        }
      });
    }

    // HACK - mw data does not track admin_5 but crop probability tables include multiple per
    // district so create entries to use in filter
    else {
      const additionalLocations = allData.map(({ id, label }) => {
        const [admin_4, admin_5] = id.split('/');
        return { id: admin_5, admin_4, label };
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
