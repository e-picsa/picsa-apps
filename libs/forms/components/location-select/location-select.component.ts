import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { GEO_LOCATION_DATA, IGelocationData } from '@picsa/data/geoLocation';
import { isEqual } from '@picsa/utils/object.utils';

/**
 * Forecast location select displays dropdown selection boxes for administrative level 4 and 5
 * locations within the current user selected country.
 *
 * This is slightly complicated as different countries use different terminology to describe
 * administrative location levels, and not all countries use all levels.
 *
 * E.g. In Malawi it shows dropdown  [4|District]
 * E.g. In Zambia is shows dropdowns [4|Province] [5|District]
 *
 * NOTE - this is not currently setup for full formcontrol binding (Future TODO)
 */
@Component({
  selector: 'picsa-form-location-select',
  standalone: false,
  templateUrl: './location-select.component.html',
  styleUrl: './location-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLocationSelectComponent {
  public countryCode = input.required<string>();

  public value = input<(string | undefined)[]>([]);

  public valueChanged = output<(string | undefined)[]>();

  /** Location selected as stored to user profile (admin_4 district/province level) */
  public admin4Selected = signal<string | undefined>(undefined);
  public admin5Options = signal<{ id: string; label: string }[]>([]);
  public admin5Selected = signal<string | undefined>(undefined);

  public computedValue = computed<(string | undefined)[]>(
    () => this.getComputedValue(this.admin4Selected(), this.admin5Selected()),
    { equal: isEqual },
  );

  public isValid = computed(() => {
    const computedValue = this.computedValue();
    const locationData = this.locationData();
    if (locationData.admin_5) return computedValue[5] ? true : false;
    return computedValue[4] ? true : false;
  });

  public locationData = computed<IGelocationData>(() => {
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
    if (this.locationData().admin_5) {
      value.push(admin5Selected);
    }
    return value;
  }

  private getLocationData(country_code: string): IGelocationData {
    const locationData = GEO_LOCATION_DATA[country_code];
    if (locationData) {
      return locationData;
    } else {
      console.error('[Location Select] no data for country', country_code);
      return { admin_4: { label: '', locations: [], topoJson: () => null as any } };
    }
  }

  /** Update admin 5 options/selected when admin 4 changes */
  private handleAdmin4Selected(admin4Selected: string | undefined) {
    if (!admin4Selected) return;
    const admin5Locations = this.locationData().admin_5?.locations;
    if (admin5Locations) {
      const filteredLocations = admin5Locations.filter((o) => o.admin_4 === admin4Selected);
      this.admin5Options.set(filteredLocations);
      const admin5Selected = this.admin5Selected();
      if (admin5Selected && !filteredLocations.find((v) => v.id === admin5Selected)) {
        this.admin5Selected.set(undefined);
      }
    }
  }
}
