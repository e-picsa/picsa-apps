import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConfigurationService } from '@picsa/configuration/src';
import { ICountryCode } from '@picsa/data';
import { GEO_LOCATION_DATA } from '@picsa/data/geoLocation';
import { PicsaTranslateModule } from '@picsa/shared/modules';

/**
 * Forecast location select displays dropdown selection boxes for administrative level 4 and 5
 * locations within the current user selected country.
 *
 * This is slightly complicated as different countries use different terminology to describe
 * administrative location levels, and not all countries use all levels.
 *
 * E.g. In Malawi it shows dropdown  [4|District]
 * E.g. In Zambia is shows dropdowns [4|Province] [5|District]
 */
@Component({
  selector: 'forecast-location-select',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, PicsaTranslateModule],
  templateUrl: './location-select.component.html',
  styleUrl: './location-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastLocationSelectComponent {
  /** Options provided to location select (admin_4 district/province level) */
  public admin4Options = signal<{ id: string; label: string }[]>([]);
  public admin5Options = signal<{ id: string; label: string }[]>([]);

  /** Label used for location select (admin_4 district/province level) */
  public admin4Label = signal('');
  public admin5Label = signal('');

  /** Location selected as stored to user profile (admin_4 district/province level) */
  public admin4Selected = computed(() => this.configurationService.userSettings().location[4]);
  public admin5Selected = computed(() => this.configurationService.userSettings().location[5]);

  private countrySelected = computed(() => this.configurationService.userSettings().location[2] as ICountryCode);

  constructor(private configurationService: ConfigurationService) {
    // Generate admin 4 options
    effect(() => {
      const selected = this.countrySelected();
      if (selected) {
        this.generateAdmin4Options(selected);
      }
    });

    // Generate admin 5 options
    effect(() => {
      const selected = this.admin4Selected();
      if (selected) {
        this.generateAdmin5Options(this.countrySelected(), selected);
      }
    });

    // Set default admin_4 option
    effect(() => {
      if (!this.admin4Selected() && this.admin4Options().length > 0) {
        this.handleUserLocationSelect(this.admin4Options()[0].id, 4);
      }
    });

    // Set default admin_5 option
    effect(() => {
      if (!this.admin5Selected() && this.admin5Options().length > 0) {
        this.handleUserLocationSelect(this.admin5Options()[0].id, 5);
      }
    });
  }

  /** When user district/province selected store to user profile location data */
  public handleUserLocationSelect(id: string, admin_level: 4 | 5) {
    const update = [...this.configurationService.userSettings().location];
    update[admin_level] = id;
    // clear admin_5 on admin_4 change
    if (admin_level === 4) {
      update[5] = undefined;
    }
    this.configurationService.updateUserSettings({ location: update });
  }

  private generateAdmin4Options(country_code: ICountryCode) {
    const geoLocationData = GEO_LOCATION_DATA[country_code];
    const options = geoLocationData?.admin_4.locations || [];
    this.admin4Label.set(geoLocationData?.admin_4.label || '');
    this.admin4Options.set(options);
  }

  private generateAdmin5Options(country_code: ICountryCode, admin_4: string) {
    const geoLocationData = GEO_LOCATION_DATA[country_code];
    const options = geoLocationData?.admin_5?.locations || [];
    const filtered = options.filter((v) => v.admin_4 === admin_4);
    this.admin5Label.set(geoLocationData?.admin_5?.label || '');
    this.admin5Options.set(filtered);
  }
}
