import { CalendarDataEntry_v0, CalendarDataEntry_v1 } from './types';

export default {
  1: (d: CalendarDataEntry_v0): CalendarDataEntry_v1 => {
    // Convert activities: { [key]: string[] } → { [key]: string[][] }
    const activities: CalendarDataEntry_v1['activities'] = {};
    for (const [enterprise, values] of Object.entries(d.activities)) {
      activities[enterprise] = values.map((v) => [v]);
    }

    // Convert weather: string[] → string[][]
    const weather = d.weather.map((v) => [v]);

    return { ...d, activities, weather };
  },
};
