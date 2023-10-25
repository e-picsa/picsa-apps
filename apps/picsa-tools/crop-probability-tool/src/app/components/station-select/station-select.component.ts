import { Component, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TourService } from '@picsa/shared/services/core/tour.service';

import { STATION_CROP_DATA } from '../../data/mock';
import { IStationRouteQueryParams } from '../../models';
import { CROP_PROBABILITY_TOUR_STEP_TWO } from '../../data/tour';

@Component({
  selector: 'crop-probability-station-select',
  templateUrl: './station-select.component.html',
  styleUrls: ['./station-select.component.scss'],
})
export class CropProbabilityStationSelectComponent {
  public stations = STATION_CROP_DATA;

  @Input() selectedStationId?: string;

  constructor(private router: Router, private route: ActivatedRoute, private tourService: TourService) {}

  /** When station changes update route query params so that parent can handle updates */
  public handleStationChange(stationId: string) {
    const queryParams: IStationRouteQueryParams = { stationId };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  // Trigger step two of tour after the dropdown has been clicked
  public handleTourStepTwo() {
    const trigger = localStorage.getItem('TourTrigger');
    if (trigger === 'true') {
      this.tourService.startTour(CROP_PROBABILITY_TOUR_STEP_TWO);
    } 
  }
}
