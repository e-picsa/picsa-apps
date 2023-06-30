import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { STATION_CROP_DATA } from '../../data/mock';
import { IStationRouteQueryParams } from '../../models';

@Component({
  selector: 'crop-probability-station-select',
  templateUrl: './station-select.component.html',
  styleUrls: ['./station-select.component.scss'],
})
export class CropProbabilityStationSelectComponent {
  public stations = STATION_CROP_DATA;

  @Input() selectedStationId?: string;

  constructor(private router: Router, private route: ActivatedRoute) {}

  /** When station changes update route query params so that parent can handle updates */
  public handleStationChange(stationId: string) {
    const queryParams: IStationRouteQueryParams = { stationId };
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
