export interface CalendarDataEntry_v0 {
  id: string;
  name: string;
  activities: {
    [enterprise: string]: string[];
  };
  weather: string[];
  meta: {
    /** Specified time period. Sets number of items shown in activities and weather */
    months: string[];
    /** Selected enterprise type. Sets available enterprises (currently only 'crop') */
    enterpriseType: 'crop';
    /** Selected enterprises. Sets the entries shown in activities */
    enterprises: string[];
  };
}
