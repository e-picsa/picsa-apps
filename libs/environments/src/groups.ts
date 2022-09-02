import type { IGroupSettings, IAppVariants } from '@picsa/models';

// groups are used to provide different data endpoints
// by default
// note, more groups are created on the live server, these just function for offline purposes
const groups: { [variant in IAppVariants]: IGroupSettings } = {
  GLOBAL: { code: 'GLOBAL', subgroups: ['MW', 'ZM', 'KE'] },
  MALAWI: { code: 'MW', subgroups: [] },
  ZAMBIA: { code: 'ZM', subgroups: [] },
  KENYA: { code: 'KE', subgroups: [] },
  DEV: { code: '_DEV', subgroups: ['MW', 'ZM', 'KE'] },
};

export default groups;
