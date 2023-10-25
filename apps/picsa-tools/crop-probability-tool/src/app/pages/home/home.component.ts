import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TourService } from '@picsa/shared/services/core/tour.service';

import { STATION_CROP_DATA } from '../../data/mock';
import { IStationCropInformation, IStationRouteQueryParams } from '../../models';
import { CROP_PROBABILITY_TOUR_STEP_ONE } from '../../data/tour';

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

  // Start tour on click of tour button, store a temp value in localstorage to trigger other steps
  public triggerTourStepOne() {
    localStorage.setItem('TourTrigger', 'true');
    this.tourService.startTour(CROP_PROBABILITY_TOUR_STEP_ONE);
  }

}

