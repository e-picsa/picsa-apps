import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ICountryCode } from '@picsa/data';
import { getGeoLocationData, getLocationSlots, IGeolocationData } from '@picsa/data/geoLocation';
import { isEqual } from '@picsa/utils/object.utils';

/**
 * Location select displays dropdown selection boxes for administrative parent and sub-location
 * tiers within the current user selected country.
 *
 * Each country defines its own slots (e.g. mw: [admin_4], zm: [admin_4, admin_5], zw: [admin_4, admin_6]).
 * The first dropdown renders the parent tier, and when a secondary tier exists, the second dropdown renders
 * the deepest defined sublocation tier.
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

  /** Parent tier selected (e.g. Province in multi-tier, District in single-tier) */
  public parentSelected = signal<string | undefined>(undefined);
  /** Deepest sublocation tier options and selection */
  public sublocationOptions = signal<{ id: string; label: string }[]>([]);
  public sublocationSelected = signal<string | undefined>(undefined);

  /** Backwards-compatible aliases for legacy templates and specs */
  public get admin4Selected() {
    return this.parentSelected;
  }
  public get admin5Selected() {
    return this.sublocationSelected;
  }
  public get admin5Options() {
    return this.sublocationOptions;
  }

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
    () => this.getComputedValue(this.parentSelected(), this.sublocationSelected()),
    { equal: isEqual },
  );

  public isValid = computed(() => {
    const computedValue = this.computedValue();
    if (this.sublocation()) return Boolean(computedValue[5]);
    return Boolean(computedValue[4]);
  });

  public locationData = computed<IGeolocationData>(() => {
    const countryCode = this.countryCode();
    return this.getLocationData(countryCode);
  });

  constructor() {
    // Set input values when passed
    effect(() => {
      const inputValue = this.value();
      this.parentSelected.set(inputValue[4]);
      this.sublocationSelected.set(inputValue[5]);
    });

    effect(() => {
      const parentSelected = this.parentSelected();
      this.handleParentSelected(parentSelected);
    });

    // Emit value changes whenever computedValue updates (e.g. parent selected, sublocation selected, or cleared)
    let lastEmitted: (string | undefined)[] | undefined = undefined;
    effect(() => {
      const computedValue = this.computedValue();
      if (computedValue && !isEqual(computedValue, lastEmitted)) {
        if (computedValue[4] || computedValue[5] || (lastEmitted && (lastEmitted[4] || lastEmitted[5]))) {
          lastEmitted = computedValue;
          this.valueChanged.emit(computedValue);
        }
      }
    });
  }

  private getComputedValue(parentSelected?: string, sublocationSelected?: string) {
    const value = [undefined, undefined, this.countryCode(), undefined, parentSelected];
    if (this.sublocation()) {
      value.push(sublocationSelected);
    }
    return value;
  }

  private getLocationData(country_code: string): IGeolocationData {
    const locationData = getGeoLocationData(country_code as ICountryCode);
    return this.locationModifier()(locationData, country_code);
  }

  /** Update sublocation options/selected when parent tier selection changes */
  private handleParentSelected(parentSelected: string | undefined) {
    if (!parentSelected) {
      this.sublocationOptions.set([]);
      this.sublocationSelected.set(undefined);
      return;
    }
    const sublocation = this.sublocation();
    if (sublocation) {
      const parentSlot = sublocation.parentSlot;
      const filteredLocations = sublocation.locations.filter(
        (o) => (o as Record<string, string>)[parentSlot] === parentSelected,
      );
      this.sublocationOptions.set(filteredLocations);
      let currentSublocation = this.sublocationSelected();
      if (currentSublocation && !filteredLocations.find((v) => v.id === currentSublocation)) {
        currentSublocation = undefined;
        this.sublocationSelected.set(undefined);
      }
      // Set value when only 1 option available
      if (!currentSublocation && filteredLocations.length === 1) {
        this.sublocationSelected.set(filteredLocations[0].id);
      }
    }
  }
}
