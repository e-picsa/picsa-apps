import { Component } from '@angular/core';
import { IsActiveMatchOptions } from '@angular/router';

import * as DATA from '../../data';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss'],
})
export class ViewSelectComponent {
  // TODO - can come from service
  availableCharts = DATA.CHART_TYPES;
  availableReports = DATA.REPORT_TYPES;

  routerLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
    queryParams: 'exact',
  };
}
