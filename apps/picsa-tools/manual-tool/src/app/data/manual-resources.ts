import { ILocaleCode } from '@picsa/data';
/**
 * Re-export manual resources from resource tool
 * TODO - consider if still required in resources or if can be moved standalone here
 */
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PICSA_MANUAL_RESOURCES } from '@picsa/resources/data/picsa/manuals';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { IResourceFile } from '@picsa/resources/schemas';

import { IManualVariant } from '../models';

export const LOCALISED_MANUALS: { [version in IManualVariant]: { [code in ILocaleCode]?: IResourceFile } } = {
  extension: {
    global_en: PICSA_MANUAL_RESOURCES.picsa_manual,
    mw_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
    zm_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa,
  },
  farmer: {
    global_en: PICSA_MANUAL_RESOURCES.picsa_manual_farmer,
    mw_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa_farmer,
    // zm_ny: PICSA_MANUAL_RESOURCES.picsa_manual_chichewa_farmer,

    zm_bem: PICSA_MANUAL_RESOURCES.picsa_manual_farmer_zm_bem,
    zm_loz: PICSA_MANUAL_RESOURCES.picsa_manual_farmer_zm_loz,
    zm_lun: PICSA_MANUAL_RESOURCES.picsa_manual_farmer_zm_lun,
    zm_lue: PICSA_MANUAL_RESOURCES.picsa_manual_farmer_zm_lue,
    zm_toi: PICSA_MANUAL_RESOURCES.picsa_manual_farmer_zm_toi,
  },
} as const;
