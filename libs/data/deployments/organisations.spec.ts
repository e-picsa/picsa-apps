import { COUNTRY_SPECIFIC_ORGANISATIONS, getOrganisationsForCountry, GLOBAL_ORGANISATIONS } from './organisations';

describe('organisations', () => {
  it('should include World Food Programme (WFP) in global organisations before OTHER', () => {
    const wfp = GLOBAL_ORGANISATIONS.find((o) => o.id === 'WFP');
    expect(wfp).toEqual({ id: 'WFP', label: 'World Food Programme (WFP)' });

    const lastOrg = GLOBAL_ORGANISATIONS[GLOBAL_ORGANISATIONS.length - 1];
    expect(lastOrg.id).toBe('OTHER');
  });

  it('should include ARDAS and MSD for Zimbabwe (zw)', () => {
    const zwOrgs = COUNTRY_SPECIFIC_ORGANISATIONS.zw ?? [];
    expect(zwOrgs).toEqual([
      { id: 'ARDAS', label: 'Agricultural and Rural Development Advisory Services (ARDAS)' },
      { id: 'MSD', label: 'Meteorological Services Department Of Zimbabwe (MSD)' },
    ]);
  });

  it('should return country-specific and global organisations when querying ZW', () => {
    const orgs = getOrganisationsForCountry('zw');
    const ids = orgs.map((o) => o.id);

    expect(ids).toContain('ARDAS');
    expect(ids).toContain('MSD');
    expect(ids).toContain('WFP');
    expect(ids).toContain('OTHER');
  });
});
