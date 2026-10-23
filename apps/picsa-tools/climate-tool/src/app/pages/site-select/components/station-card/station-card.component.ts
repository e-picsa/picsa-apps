import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IStationMeta } from '@picsa/models';

import type { IStationRecommendation } from '../../../../utils/location-proximity.utils';

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
}
