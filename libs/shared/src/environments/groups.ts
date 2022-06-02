import { IGroupSettings, IAppVariants } from '@picsa/models';

// groups are used to provide different data endpoints
// by default
// note, more groups are created on the live server, these just function for offline purposes
const groups: { [variant in IAppVariants]: IGroupSettings } = {
  MALAWI: { code: 'MW', subgroups: ['2019'] },
  KENYA: { code: 'KE', subgroups: [] },
  DEFAULT: { code: 'DEFAULT', subgroups: [] },
  DEV: { code: '_DEV', subgroups: [] }
};

export default groups;
