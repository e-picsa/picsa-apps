import { Component, computed, effect, Input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { capitalise } from '@picsa/utils';

import { STATION_CROP_DATA } from '../../data/mock';
import { IStationRouteQueryParams } from '../../models';

@Component({
  selector: 'crop-probability-station-select',
  templateUrl: './station-select.component.html',
  styleUrls: ['./station-select.component.scss'],
})
export class CropProbabilityStationSelectComponent {
  @Input() selectedStationId?: string;

  private stationsByCountry = computed(() => {
    const { country_code } = this.configurationService.userSettings();
    if (country_code) {
      return STATION_CROP_DATA[country_code];
    }
    return [];
  });

  public districtOptions = computed(() => {
    const allStations = this.stationsByCountry();

    const districtEntries = allStations.map((s) => s.station_district_id);
    return [...new Set(districtEntries)].sort().map((id) => ({ id, label: capitalise(id.replace('_', ' ')) }));
  });
  public districtSelected = signal<string | undefined>(undefined);

  public stationsOptions = computed(() => {
    const allStations = this.stationsByCountry();
    const district = this.districtSelected();
    if (district) {
      const options = allStations.filter((s) => s.station_district_id === district);
      if (options.length === 1) {
        // TODO - auto select
      }
      return options;
    }

    return [];
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private configurationService: ConfigurationService
  ) {
    effect(
      // Automaticallly select first station in district
      () => {
        const stationOptions = this.stationsOptions();
        if (stationOptions.length > 0) {
          this.handleStationChange(stationOptions[0].id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** When station changes update route query params so that parent can handle updates */
  public handleStationChange(stationId: string) {
    const queryParams: IStationRouteQueryParams = { stationId };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
