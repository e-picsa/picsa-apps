import { ICountryCode } from './countries';

export interface IOrganisation {
  id: string;
  label: string;
  icon?: string;
}

export const GLOBAL_ORGANISATIONS: IOrganisation[] = [
  { id: 'UOR', label: 'University of Reading' },
  { id: 'IDEMS', label: 'IDEMS' },
  { id: 'C2DEV', label: 'C2Dev' },
  { id: 'OTHER', label: 'Other' },
];

export const COUNTRY_SPECIFIC_ORGANISATIONS: Partial<Record<ICountryCode | string, IOrganisation[]>> = {
  mw: [
    { id: 'DCCMS', label: 'Department of Climate Change and Meteorological Services (DCCMS)' },
    { id: 'MOA_MW', label: 'Ministry of Agriculture' },
    { id: 'GIZ', label: 'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)' },
  ],
  zm: [
    { id: 'ZMD', label: 'Zambia Meteorological Department (ZMD)' },
    { id: 'MOA_ZM', label: 'Ministry of Agriculture' },
    { id: 'GIZ', label: 'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)' },
  ],
  zw: [
    { id: 'ARDAS', label: 'Agricultural and Rural Development Advisory Services (ARDAS)' },
    { id: 'MSD', label: 'Meteorological Services Department Of Zimbabwe (MSD)' },
    { id: 'WFP', label: 'World Food Programme (WFP)' },
  ],
};

/**
 * Get list of organisations for a specific country.
 * Country-specific organisations come first (to prioritise ordering),
 * followed by global organisations (excluding any already listed for the country).
 * Otherwise returns the global list.
 */
export function getOrganisationsForCountry(countryCode: string): IOrganisation[] {
  const countryOrgs = COUNTRY_SPECIFIC_ORGANISATIONS[countryCode] || [];
  const countryOrgIds = new Set(countryOrgs.map(({ id }) => id));
  const filteredGlobalOrgs = GLOBAL_ORGANISATIONS.filter(({ id }) => !countryOrgIds.has(id));

  return [...countryOrgs, ...filteredGlobalOrgs];
}
