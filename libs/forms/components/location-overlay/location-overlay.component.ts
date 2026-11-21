import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ICountryCode } from '@picsa/data';
import { GeoToolKey, IGeolocationData, ILocationSelection, isSelectionComplete } from '@picsa/data/geoLocation';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FormLocationSelectComponent } from '../location-select/location-select.component';

/**
 * Modal overlay wrapper around the location select dropdowns.
 * Seeds an initial selection on open and only emits on confirm so hosts never observe partial selections.
 */
@Component({
  selector: 'picsa-form-location-overlay',
  imports: [CommonModule, FormLocationSelectComponent, MatButtonModule, MatIcon, PicsaTranslateModule],
  templateUrl: './location-overlay.component.html',
  styleUrl: './location-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLocationOverlayComponent {
  public countryCode = input.required<string>();
  public value = input<ILocationSelection>({});
  public tool = input<GeoToolKey | undefined>(undefined);
  public locationModifier = input<(data: IGeolocationData, countryCode: string) => IGeolocationData>((data) => data);

  public title = input<string>(translateMarker('Select Location'));
  public subtitle = input<string>(translateMarker('Please select a location to view local forecasts'));
  public allowCancel = input<boolean>(false);

  public open = model<boolean>(false);

  public confirmed = output<ILocationSelection>();
  public cancelled = output<void>();

  private readonly locationSelect = viewChild(FormLocationSelectComponent);

  /** Snapshot passed to the child selector on open (never fed back on local edits) */
  public initialSelection = signal<ILocationSelection>({});
  public tempSelection = signal<ILocationSelection>({});

  public isTempLocationReady = computed(() => {
    const select = this.locationSelect();
    if (select) return select.isValid();
    const country = this.countryCode();
    return country ? isSelectionComplete(country as ICountryCode, this.tempSelection(), this.tool()) : false;
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        const seed = { ...(untracked(() => this.value()) ?? {}) };
        this.initialSelection.set(seed);
        this.tempSelection.set(seed);
      }
    });
  }

  public handleTempLocationUpdate(selection: ILocationSelection) {
    this.tempSelection.set(selection);
  }

  public handleCancel() {
    this.cancelled.emit();
  }

  public handleConfirm() {
    if (this.isTempLocationReady()) {
      this.confirmed.emit(this.tempSelection());
    }
  }
}
