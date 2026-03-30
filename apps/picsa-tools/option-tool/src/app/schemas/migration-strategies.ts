import { generateID } from '@picsa/shared/services/core/db/db.service';
import { generateTimestamp } from '@picsa/shared/services/core/db_v2';

import {
  IOptionsToolEntry_v0,
  IOptionsToolEntry_v1,
  IOptionsToolEntry_v2,
  IOptionsToolEntry_v3,
  IOptionsToolEntry_v4,
  IOptionsToolEntry_v5,
} from './types';

export default {
  1: (data: IOptionsToolEntry_v0): IOptionsToolEntry_v1 => ({
    ...data,
  }),
  2: (data: IOptionsToolEntry_v1): IOptionsToolEntry_v2 => {
    const { gender, ...data_without_gender } = data;
    return {
      // rename 'gender' to 'gender_activities' and add 'gender_decisions'
      ...data_without_gender,
      gender_activities: gender,
      gender_decisions: [],
      // add new id
      _id: generateID(),
    };
  },
  3: (data: IOptionsToolEntry_v2): IOptionsToolEntry_v3 => {
    return {
      ...data,
      time: {
        unit: 'month',
        value: parseInt(data.time) || 0,
      },
      risk: [data.risk],
    };
  },

  4: (data: IOptionsToolEntry_v3): IOptionsToolEntry_v4 => ({
    ...data,
    enterprise: 'crop',
    _created_at: generateTimestamp(),
  }),
  // Renamed time.value -> time.quantity for improved FormField compatibility ("value" reserved)
  5: (d: IOptionsToolEntry_v4): IOptionsToolEntry_v5 => {
    return {
      ...d,
      time: { quantity: d.time?.value || null, unit: d.time?.unit || null },
    };
  },
};
