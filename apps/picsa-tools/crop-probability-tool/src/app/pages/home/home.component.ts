import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TourService } from '@picsa/shared/services/core/tour';
import { Subject, takeUntil } from 'rxjs';

import { STATION_CROP_DATA } from '../../data/mock';
import { CROP_PROBABILITY_SELECT_TOUR, CROP_PROBABILITY_TABLE_TOUR } from '../../data/tour';
import { IStationCropInformation, IStationRouteQueryParams } from '../../models';

@Component({
  selector: 'crop-probability-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private componentDestroyed$ = new Subject<boolean>();

  public activeStation?: IStationCropInformation;

  constructor(private route: ActivatedRoute, private tourService: TourService) {}

  ngOnInit(): void {
    this.subscribeToRouteChanges();
    this.tourService.registerTour('cropProbabilityTable', CROP_PROBABILITY_TABLE_TOUR);
    this.tourService.registerTour('cropProbabilitySelect', CROP_PROBABILITY_SELECT_TOUR);
  }
  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  private loadStationById(id: string) {
    this.activeStation = STATION_CROP_DATA.find((station) => station.id === id);
  }

  private subscribeToRouteChanges() {
    this.route.queryParams
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(({ stationId }: IStationRouteQueryParams) => {
        if (stationId) {
          this.loadStationById(stationId);
        } else {
          this.activeStation = undefined;
        }
      });
  }
}
