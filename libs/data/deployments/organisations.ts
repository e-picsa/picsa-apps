import { ICountryCode } from './countries';

export interface IOrganisation {
  id: string;
  label: string;
  icon?: string;
}

export const GLOBAL_ORGANISATIONS: IOrganisation[] = [
  { id: 'UOR', label: 'University of Reading' },
  { id: 'GIZ', label: 'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)' },
  { id: 'IDEMS', label: 'IDEMS' },
  { id: 'OTHER', label: 'Other' },
];

export const COUNTRY_SPECIFIC_ORGANISATIONS: Partial<Record<ICountryCode | string, IOrganisation[]>> = {
  mw: [
    { id: 'DCCMS', label: 'Department of Climate Change and Meteorological Services (DCCMS)' },
    { id: 'MOA_MW', label: 'Ministry of Agriculture' },
  ],
  zm: [
    { id: 'ZMD', label: 'Zambia Meteorological Department (ZMD)' },
    { id: 'MOA_ZM', label: 'Ministry of Agriculture' },
  ],
};

/**
 * Get list of organisations for a specific country.
 * If country-specific organisations exist, returns them (with Other option).
 * Otherwise returns the global list.
 */
export function getOrganisationsForCountry(countryCode: string): IOrganisation[] {
  const countryOrgs = COUNTRY_SPECIFIC_ORGANISATIONS[countryCode] || [];

  return [...countryOrgs, ...GLOBAL_ORGANISATIONS];
}
