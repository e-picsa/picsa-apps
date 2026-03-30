import { CalendarDataEntry_v0 } from './types';

export default {
  // No migrations needed for version 0
} as {
  [key: number]: (data: CalendarDataEntry_v0) => CalendarDataEntry_v0;
};
