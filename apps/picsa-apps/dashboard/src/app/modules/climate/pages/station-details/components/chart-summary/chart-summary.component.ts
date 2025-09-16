/* eslint-disable @nx/enforce-module-boundaries */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { generateChartConfig } from '@picsa/climate/src/app/utils';
import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import { IChartMeta, IStationData } from '@picsa/models/src';
import { PicsaChartComponent } from '@picsa/shared/features';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { DashboardMaterialModule } from 'apps/picsa-apps/dashboard/src/app/material.module';
import { ChartConfiguration } from 'c3';

import { hackConvertStationDataForDisplay } from '../../../../climate.utils';
import {
  ClimateComment,
  ClimateCommentDialogComponent,
} from '../../../../components/comment-dialog/comment-dialog.component';
import { ClimateCommentService } from '../../../../services/climate-comment.service';
import { IClimateStationData, IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-chart-summary',
  imports: [CommonModule, PicsaChartComponent, DashboardMaterialModule, MatBadgeModule, MatTooltipModule],
  templateUrl: './chart-summary.component.html',
  styleUrl: './chart-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSummaryComponent {
  public station = input.required<IStationRow>();

  public chartDefintions = signal<IChartMeta[]>([]);
  public activeChartDefinition = signal<IChartMeta | undefined>(undefined);

  public activeChartConfig = signal<Partial<ChartConfiguration> | undefined>(undefined);
  public comments = signal<ClimateComment[]>([]);
  public showCommentsList = signal<boolean>(false);

  readonly data = input<IClimateStationData['Row'] | null>();

  public chartData = computed<IStationData[]>(() => {
    const data = this.data();
    if (data) {
      return hackConvertStationDataForDisplay(data);
    }
    return [];
  });

  public unresolvedCommentsCount = computed<number>(() => {
    const activeChart = this.activeChartDefinition();
    if (!activeChart) return 0;
    return this.comments().filter((c) => c.chart_name === activeChart.name && !c.resolved).length;
  });

  constructor(
    private dialog: MatDialog,
    private commentService: ClimateCommentService,
    private supabaseService: SupabaseService,
  ) {
    effect(() => {
      const { country_code } = this.station();
      const definitions = CLIMATE_CHART_DEFINTIONS[country_code] || CLIMATE_CHART_DEFINTIONS.default;
      this.chartDefintions.set(Object.values(definitions));
      this.activeChartDefinition.set(definitions[0]);
    });

    effect(async () => {
      const chartData = this.chartData();
      const activeChartDefinition = this.activeChartDefinition();
      if (activeChartDefinition) {
        const chartConfig = await generateChartConfig(chartData, activeChartDefinition);
        this.activeChartConfig.set(chartConfig);
      }
    });

    // Load comments when station changes
    effect(async () => {
      const station = this.station();
      if (station) {
        try {
          const comments = await this.commentService.getComments(station.id || station.station_id);
          this.comments.set(comments);
        } catch (error) {
          console.error('Failed to load comments:', error);
          this.comments.set([]);
        }
      }
    });
  }

  public showCommentDialog() {
    const station = this.station();
    const chartDefinition = this.activeChartDefinition();

    if (station && chartDefinition) {
      const dialogRef = this.dialog.open(ClimateCommentDialogComponent, {
        width: '500px',
        data: {
          stationId: station.id || station.station_id,
          stationName: station.station_name,
          chartName: chartDefinition.name,
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          // Refresh comments after new comment is added
          try {
            const comments = await this.commentService.getComments(station.id || station.station_id);
            this.comments.set(comments);
          } catch (error) {
            console.error('Failed to refresh comments:', error);
          }
        }
      });
    }
  }

  public toggleCommentsList() {
    this.showCommentsList.set(!this.showCommentsList());
  }

  public getCommentsForCurrentChart(): ClimateComment[] {
    const activeChart = this.activeChartDefinition();
    if (!activeChart) return [];
    return this.comments().filter((c) => c.chart_name === activeChart.name);
  }

  public canEditComment(comment: ClimateComment): boolean {
    const currentUser = this.supabaseService.auth.authUser();
    return currentUser?.id === comment.created_by;
  }

  public async toggleCommentResolved(comment: ClimateComment): Promise<void> {
    const station = this.station();
    if (!station) return;

    try {
      await this.commentService.toggleCommentResolved(station.id || station.station_id, comment.id);
      // Refresh comments
      const comments = await this.commentService.getComments(station.id || station.station_id);
      this.comments.set(comments);
    } catch (error) {
      console.error('Failed to toggle comment resolved status:', error);
    }
  }

  public async deleteComment(comment: ClimateComment): Promise<void> {
    const station = this.station();
    if (!station) return;

    try {
      await this.commentService.deleteComment(station.id || station.station_id, comment.id);
      // Refresh comments
      const comments = await this.commentService.getComments(station.id || station.station_id);
      this.comments.set(comments);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }

  public openCommentModal(comment: ClimateComment): void {
    const station = this.station();
    const chartDefinition = this.activeChartDefinition();
    const canEdit = this.canEditComment(comment);

    if (!station || !chartDefinition || !canEdit) return;

    const dialogRef = this.dialog.open(ClimateCommentDialogComponent, {
      width: '500px',
      data: {
        stationId: station.id || station.station_id,
        stationName: station.station_name,
        chartName: chartDefinition.name,
        editComment: comment,
        isEditMode: true,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        // Refresh comments after edit
        try {
          const comments = await this.commentService.getComments(station.id || station.station_id);
          this.comments.set(comments);
        } catch (error) {
          console.error('Failed to refresh comments:', error);
        }
      }
    });
  }
}
