import { Component, OnDestroy, OnInit } from '@angular/core';
import { IsActiveMatchOptions } from '@angular/router';
import { IChartMeta } from '@picsa/models/src';
import { Subject, takeUntil } from 'rxjs';

import { IReportMeta } from '../../models';
import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-view-select',
  templateUrl: './view-select.html',
  styleUrls: ['./view-select.scss'],
  standalone: false,
})
export class ViewSelectComponent implements OnInit, OnDestroy {
  /** List of charts available for display */
  public availableCharts: IChartMeta[] = [];

  /** DEPRECATED - to confirm if plan to bring back */
  public availableReports: IReportMeta[] = [];

  /** Ensure router link matches station id from parameters */
  public routerLinkActiveOptions: IsActiveMatchOptions = {
    paths: 'subset',
    fragment: 'ignored',
    matrixParams: 'ignored',
    queryParams: 'exact',
  };

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
      this.availableCharts = station ? Object.values(station.definitions).filter((v) => !v.disabled) : [];
    });
  }
}
