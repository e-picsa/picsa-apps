import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';

import { ClimateService } from '../../../../climate.service';
import { DashboardClimateApiStatusComponent, IApiStatusOptions } from '../../../../components/api-status/api-status';
import { IStationRow } from '../../../../types';

@Component({
  selector: 'dashboard-climate-crop-probabilities',
  imports: [CommonModule, DashboardClimateApiStatusComponent],
  templateUrl: './crop-probabilities.component.html',
  styleUrl: './crop-probabilities.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilitiesComponent {
  public station = input.required<IStationRow>();

  public probabilityReqOptions: IApiStatusOptions = {
    events: { refresh: () => this.refreshCropProbabilities() },
    showStatusCode: true,
  };

  constructor(private service: ClimateService) {
    effect(() => {
      const station = this.station();
      this.loadCropProbabilities(station);
    });
  }
  private async loadCropProbabilities(station: IStationRow) {
    //
  }

  public async refreshCropProbabilities() {
    const data = await this.service.loadFromAPI.rainfallSummaries(this.station());
    const summary = data?.[0];
    if (summary) {
      // TODO - process data as required
    }
  }
}
