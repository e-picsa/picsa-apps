import { Component } from '@angular/core';
import { delay, take } from 'rxjs/operators';

import { PicsaTranslateService } from '@picsa/shared/modules';
import { _wait } from '@picsa/utils';
import { ClimateChartService } from '../../services/climate-chart.service';
import { PrintProvider } from '@picsa/shared/services/native';
import { IChartConfig } from '@picsa/models/src';

@Component({
  selector: 'climate-chart-options',
  templateUrl: './climate-chart-options.component.html',
  styleUrls: ['./climate-chart-options.component.scss'],
})
export class ClimateChartOptionsComponent {
  /** Track whether chart is currently being exported or not */
  public isExporting = false;

  constructor(
    private translateService: PicsaTranslateService,
    private chartService: ClimateChartService,
    private printProvider: PrintProvider
  ) {}

  /*****************************************************************************
   *   Download and Share
   ****************************************************************************/
  // update styles and when rendered save as png
  public async shareChart() {
    const { station } = this.chartService;
    this.isExporting = true;
    await _wait(50);
    const title = `${station?.name} - $chartMeta.name} - ${this.translateService.language}`;
    // update chart view for better printing
    // slightly messy - want to update chart config for print format, and wait until render
    // complete before downloading and reverting back
    this.chartService.chartRendered$
      .pipe(delay(500))
      .pipe(take(1))
      .subscribe(
        async () => {
          // TODO - handle updating print view
          // await this.picsaChart.generatePng(title);
          // this.isExporting = false;
          // // rebuild chart config instead of store/replace as issue with point r function scope
          // this.chartConfig = this.chartService.generateChartConfig(
          //   chartData,
          //   chartMeta
          // );
        },
        (err) => {
          throw err;
        }
      );

    // this.chartConfig = this._getPrintConfig(chartConfig);
  }

  // https://spin.atomicobject.com/2014/01/21/convert-svg-to-png/
  // https://github.com/exupero/saveSvgAsPng
  // https://github.com/exupero/saveSvgAsPng/issues/186
  public async generatePng(title = 'chart') {
    await this.printProvider.shareSVG('chart_svg', title);
  }

  private _getPrintConfig(config: IChartConfig) {
    config.point!.r = (d) => (d.id === 'LineTool' ? 0 : 3);
    config.size = { width: 900, height: 600 };
    return config;
  }
}
