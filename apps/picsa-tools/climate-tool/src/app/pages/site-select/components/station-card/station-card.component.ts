import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';

import type { IStationRecommendation } from '../../../../utils/location-proximity.utils';

export const STATION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6.191 0 87.619 100" fill="currentColor"><path d="M82.447,57.766c-3.112,0-5.937,1.255-7.992,3.29L55.353,47.369v-1.773c0-2.015-1.303-3.692-3.094-4.333V22.592c5.521-0.768,9.769-5.509,9.769-11.236C62.027,5.09,56.946,0,50.667,0c-6.266,0-11.348,5.091-11.348,11.355c0,5.727,4.247,10.468,9.77,11.236v18.688c-1.76,0.662-3.027,2.335-3.027,4.316v1.604L25.906,61.064c-2.071-2.262-5.049-3.678-8.355-3.678c-6.277,0-11.36,5.087-11.36,11.357c0,6.27,5.083,11.356,11.36,11.356c6.265,0,11.348-5.087,11.348-11.356c0-1.818-0.436-3.544-1.193-5.066l18.353-12.622v44.299c0,2.561,2.089,4.646,4.647,4.646c2.564,0,4.646-2.085,4.646-4.646V51.27l17.183,12.314c-0.91,1.632-1.437,3.524-1.437,5.529c0,6.283,5.087,11.357,11.351,11.357c6.273,0,11.36-5.074,11.36-11.357C93.808,62.844,88.721,57.766,82.447,57.766z"/></svg>`;

export interface IStationCardDisplayed {
  station: IStationMeta;
  isPrimary?: boolean;
  mapNumber?: number;
}

export type IStationCardNearby = IStationRecommendation & {
  mapNumber?: number;
};

const strings = {
  climateStation: translateMarker('Climate Station'),
  stations: translateMarker('Stations'),
  allStations: translateMarker('All Stations'),
  viewStation: translateMarker('View {{station}}'),
};

@Component({
  selector: 'climate-station-card',
  templateUrl: './station-card.component.html',
  styleUrls: ['./station-card.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationCardComponent {
  public readonly strings = strings;

  /** Currently displayed/selected station details */
  public readonly displayedStation = input<IStationCardDisplayed | undefined>(undefined);

  /** Recommended / alternate stations */
  public readonly nearbyStations = input<IStationCardNearby[]>([]);

  /** Confirm station selection and navigate */
  public readonly confirm = output<IStationMeta>();

  /** Select an alternate station */
  public readonly selectAlternate = output<IStationRecommendation>();

  /** Request opening the all stations modal */
  public readonly openAllStations = output<void>();

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const domSanitizer = inject(DomSanitizer);
    iconRegistry.addSvgIconLiteral('climate_station', domSanitizer.bypassSecurityTrustHtml(STATION_ICON_SVG));
  }
}
