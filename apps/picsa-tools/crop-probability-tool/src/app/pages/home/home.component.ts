import { Component, effect, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TourService } from '@picsa/shared/services/core/tour';
import { map } from 'rxjs';

import { STATION_CROP_DATA } from '../../data/mock';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IStationCropInformation, IStationRouteQueryParams } from '../../models';

@Component({
  selector: 'crop-probability-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  public activeStation?: IStationCropInformation;

  private stationParam = toSignal(
    this.route.queryParams.pipe(map(({ stationId }: IStationRouteQueryParams) => stationId))
  );

  constructor(private route: ActivatedRoute, private tourService: TourService) {
    effect(() => {
      const station = this.stationParam();
      this.activeStation = this.getStationById(station);
    });
  }

  ngOnInit(): void {
    this.tourService.registerTour('cropProbabilityTable', CROP_PROBABILITY_TABLE_TOUR);
    this.tourService.registerTour('cropProbabilitySelect', CROP_PROBABILITY_SELECT_TOUR);
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
