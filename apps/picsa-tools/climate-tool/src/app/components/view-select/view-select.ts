import { Component, OnDestroy, OnInit } from '@angular/core';
import { IsActiveMatchOptions } from '@angular/router';

import { ClimateChartService } from '../../services/climate-chart.service';
import { IChartMeta } from '@picsa/models/src';
import { IReportMeta } from '../../models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss'],
})
export class ViewSelectComponent implements OnInit, OnDestroy {
  /** List of charts available for display */
  availableCharts: IChartMeta[] = [];

  /** DEPRECATED - to confirm if plan to bring back */
  availableReports: IReportMeta[] = [];

  private componentDestroyed$ = new Subject();

  constructor(private chartService: ClimateChartService) {}

  ngOnInit(): void {
    this.subscribeToStationChanges();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next(true);
    this.componentDestroyed$.complete();
  }

  /** Update list of available charts when station changes */
  private subscribeToStationChanges() {
    this.chartService.station$.pipe(takeUntil(this.componentDestroyed$)).subscribe((station) => {
      this.availableCharts = station ? Object.values(station.definitions) : [];
    });
  }

  /** Ensure router link matches station id from parameters */
  public routerLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
    queryParams: 'exact',
  };
}
