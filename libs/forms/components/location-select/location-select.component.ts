import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ICountryCode } from '@picsa/data';
import { getGeoLocationData, getLocationSlots, IGeolocationData } from '@picsa/data/geoLocation';
import { isEqual } from '@picsa/utils/object.utils';

/**
 * Forecast location select displays dropdown selection boxes for administrative level 4 and
 * sublocation levels within the current user selected country.
 *
 * This is slightly complicated as different countries use different terminology to describe
 * administrative location levels, and not all countries use all levels. Each country defines
 * its own slots (mw: admin_4, zm: admin_4+admin_5, zw: admin_4+admin_6) and the second
 * dropdown always renders the deepest defined tier.
 *
 * E.g. In Malawi it shows dropdown  [4|District]
 * E.g. In Zambia is shows dropdowns [4|Province] [5|District]
 * E.g. In Zimbabwe is shows dropdowns [4|Province] [6|District]
 *
 * NOTE - this is not currently setup for full formcontrol binding (Future TODO)
 */
@Component({
  selector: 'picsa-form-location-select',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './location-select.component.html',
  styleUrl: './location-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLocationSelectComponent {
  public countryCode = input.required<string>();

  public value = input<(string | undefined)[]>([]);

  /** Optional method to apply to data before rendering locations in list */
  public locationModifier = input<(data: IGeolocationData, countryCode: string) => IGeolocationData>((data) => data);

  public valueChanged = output<(string | undefined)[]>();

  /** Location selected as stored to user profile (admin_4 district/province level) */
  public admin4Selected = signal<string | undefined>(undefined);
  public admin5Options = signal<{ id: string; label: string }[]>([]);
  public admin5Selected = signal<string | undefined>(undefined);

  /** Deepest location tier defined for the country (drives the second dropdown) */
  public sublocation = computed(() => {
    const locationData = this.locationData();
    const slots = getLocationSlots(locationData);
    if (slots.length < 2) return undefined;
    const slot = slots[slots.length - 1];
    const parentSlot = slots[slots.length - 2];
    return { slot, parentSlot, ...locationData[slot]! };
  });

  public computedValue = computed<(string | undefined)[]>(
    () => this.getComputedValue(this.admin4Selected(), this.admin5Selected()),
    { equal: isEqual },
  );

  public isValid = computed(() => {
    const computedValue = this.computedValue();
    if (this.sublocation()) return computedValue[5] ? true : false;
    return computedValue[4] ? true : false;
  });

  public locationData = computed<IGeolocationData>(() => {
    const countryCode = this.countryCode();
    return this.getLocationData(countryCode);
  });

  constructor() {
    // Set input values when passed
    effect(() => {
      const inputValue = this.value();
      this.admin4Selected.set(inputValue[4]);
      this.admin5Selected.set(inputValue[5]);
    });

    effect(() => {
      const admin4Selected = this.admin4Selected();
      this.handleAdmin4Selected(admin4Selected);
    });
    // Emit value changes when valid
    effect(() => {
      const computedValue = this.computedValue();
      const isValid = this.isValid();
      if (computedValue && isValid) {
        this.valueChanged.emit(computedValue);
      }
    });
  }

  private getComputedValue(admin4Selected?: string, admin5Selected?: string) {
    const value = [undefined, undefined, this.countryCode(), undefined, admin4Selected];
    if (this.sublocation()) {
      value.push(admin5Selected);
    }
    return value;
  }

  private getLocationData(country_code: string): IGeolocationData {
    const locationData = getGeoLocationData(country_code as ICountryCode);
    return this.locationModifier()(locationData, country_code);
  }

  /** Update sublocation options/selected when admin 4 changes */
  private handleAdmin4Selected(admin4Selected: string | undefined) {
    if (!admin4Selected) return;
    const sublocation = this.sublocation();
    if (sublocation) {
      const parentSlot = sublocation.parentSlot;
      const filteredLocations = sublocation.locations.filter(
        (o) => (o as Record<string, string>)[parentSlot] === admin4Selected,
      );
      this.admin5Options.set(filteredLocations);
      const admin5Selected = this.admin5Selected();
      if (admin5Selected && !filteredLocations.find((v) => v.id === admin5Selected)) {
        this.admin5Selected.set(undefined);
      }
      // Set value when only 1 option available
      if (!admin5Selected && filteredLocations.length === 1) {
        this.admin5Selected.set(filteredLocations[0].id);
      }
    }
  }
}
