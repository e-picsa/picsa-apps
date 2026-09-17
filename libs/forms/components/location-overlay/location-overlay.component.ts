import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ICountryCode } from '@picsa/data';
import { getGeoLocationData, IGeolocationData } from '@picsa/data/geoLocation';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FormLocationSelectComponent } from '../location-select/location-select.component';

export type ILocationArray = (string | undefined)[];

/**
 * Modal overlay wrapper around the location select dropdowns.
 * Holds a temporary location whilst the user edits and only emits on confirm,
 * so hosts never observe partial selections.
 */
@Component({
  selector: 'picsa-form-location-overlay',
  imports: [CommonModule, FormLocationSelectComponent, MatButtonModule, MatIcon, PicsaTranslateModule],
  templateUrl: './location-overlay.component.html',
  styleUrl: './location-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLocationOverlayComponent {
  /** Country to list locations for */
  public countryCode = input.required<string>();

  /** Currently saved location, used to seed the temporary selection when opened */
  public value = input<ILocationArray>([]);

  /** Optional method to filter locations before rendering (e.g. only stations with data) */
  public locationModifier = input<(data: IGeolocationData, countryCode: string) => IGeolocationData>((data) => data);

  /** Translation keys for overlay copy */
  public title = input<string>(translateMarker('Select Location'));
  public subtitle = input<string>(translateMarker('Please select a location to view local forecasts'));

  /** Show a cancel action (hide when selection is enforced, e.g. no location saved yet) */
  public allowCancel = input<boolean>(false);

  public open = model<boolean>(false);

  public confirmed = output<ILocationArray>();
  public cancelled = output<void>();

  public tempLocation = signal<ILocationArray | undefined>(undefined);

  public isTempLocationReady = computed(() => {
    const temp = this.tempLocation();
    const country = this.countryCode();
    if (!country || !temp) return false;
    const geoData = getGeoLocationData(country as ICountryCode);
    if (geoData.admin_5) {
      return !!temp[4] && !!temp[5];
    }
    return !!temp[4];
  });

  constructor() {
    // Seed temporary selection from saved value whenever opened
    effect(() => {
      if (this.open()) {
        this.tempLocation.set(this.value());
      }
    });
  }

  public handleTempLocationUpdate(location: ILocationArray) {
    this.tempLocation.set(location);
  }

  public handleCancel() {
    this.cancelled.emit();
  }

  public handleConfirm() {
    const temp = this.tempLocation();
    if (temp && this.isTempLocationReady()) {
      this.confirmed.emit(temp);
    }
  }
}
