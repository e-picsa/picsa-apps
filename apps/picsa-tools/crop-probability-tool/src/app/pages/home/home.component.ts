import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { IGelocationData } from '@picsa/data/geoLocation';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTourButton, TourService } from '@picsa/shared/services/core/tour';
import { map } from 'rxjs';

import { CropProbabilityTableComponent } from '../../components/crop-probability-table/crop-probability-table.component';
import { PROBABILITY_TABLE_DATA } from '../../data';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IProbabilityTable, IStationCropData } from '../../models';

interface IQueryParams {
  /** id of active selected station */
  locationId?: string;
}

const STORED_LOCATION_FIELD = 'picsa_crop_tool_location';

@Component({
  selector: 'crop-probability-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [PicsaFormsModule, CropProbabilityTableComponent, PicsaTourButton],
})
export class HomeComponent implements OnInit {
  public locationId = toSignal(this.route.queryParams.pipe(map(({ locationId }: IQueryParams) => locationId)));

  public countryCode = computed(() => this.configService.deploymentSettings().country_code);

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourService: TourService,
    private configService: ConfigurationService,
  ) {
    effect(async () => {
      const meta = this.tableStationMeta();
      if (meta) {
        // load data from meta definition
        const data = await meta.data();
        this.tableStationData.set(data);
      }
    });
  }

  ngOnInit(): void {
    //  load previously selected location
    const locationId = this.locationId();
    if (!locationId) {
      const savedLocation = localStorage.getItem(STORED_LOCATION_FIELD);
      if (savedLocation) {
        this.handleLocationChange([savedLocation]);
      }
    }
    this.tourService.registerTour('cropProbabilityTable', CROP_PROBABILITY_TABLE_TOUR);
    this.tourService.registerTour('cropProbabilitySelect', CROP_PROBABILITY_SELECT_TOUR);
  }

  /** Modify locations to only include values that have probability data */
  public locationModifier(data: IGelocationData, country_code: string): IGelocationData {
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

  public handleLocationChange(location: (string | undefined)[]) {
    const targetLocation = location.filter((v) => v !== undefined).pop();
    localStorage.setItem(STORED_LOCATION_FIELD, targetLocation as string);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { locationId: targetLocation },
      replaceUrl: true,
    });
  }
}
