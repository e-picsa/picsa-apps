import { Component, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TourService } from '@picsa/shared/services/core/tour';
import { map } from 'rxjs';

import { STATION_CROP_DATA } from '../../data/mock';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IProbabilityTableStationMeta, IStationCropInformation, IStationRouteQueryParams } from '../../models';

@Component({
  selector: 'crop-probability-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  public stationId = toSignal(this.route.queryParams.pipe(map(({ stationId }: IStationRouteQueryParams) => stationId)));

  public station = computed(() => {
    const stationId = this.stationId();
    return this.getStationById(stationId);
  });

  /** */
  public tableStationData = computed(() => this.station()?.data || []);

  /** */
  public tableStationMeta = computed<IProbabilityTableStationMeta | undefined>(() => {
    const station = this.station();
    if (station) {
      const { dates, notes, season_probabilities, station_name } = station;
      return {
        dateHeadings: dates,
        label: station_name,
        notes,
        seasonProbabilities: season_probabilities,
      };
    }
    return undefined;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourService: TourService,
  ) {}

  ngOnInit(): void {
    this.tourService.registerTour('cropProbabilityTable', CROP_PROBABILITY_TABLE_TOUR);
    this.tourService.registerTour('cropProbabilitySelect', CROP_PROBABILITY_SELECT_TOUR);
  }

  public handleStationChange() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stationId: this.stationId() },
      replaceUrl: true,
    });
  }

  private getStationById(id?: string) {
    if (id) {
      const [country_code] = id.split('/');
      const stations: IStationCropInformation[] = STATION_CROP_DATA[country_code] || [];
      return stations.find((s) => s.id === id);
    } else {
      return undefined;
    }
  }
}
