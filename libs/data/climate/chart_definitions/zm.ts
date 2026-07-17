import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

definitions.end.definition =
  'First occurance from 1 Mar where water balance reduces to 0.5 mm from an initial capacity of 100mm with an assumed evaporation rate of 5mm/day';
definitions.extreme_rainfall_days.definition = '';
definitions.length.definition = 'Number of days between start of the rains and end of the season';
definitions.rainfall.definition = 'Total rainfall per year from start of the rains to end of the season';
definitions.start.definition =
  'First occurance from 1 Oct with at least 20 mm of rainfall over 3 consecutive days (with no dry spell of length 9 in the next 21 days)';
definitions.temp_max.definition = 'The mean maximum and highest maximum daily temperatures per year';
definitions.temp_min.definition = 'The mean minimum and lowest minimum daily temperatures per year';

export default definitions;
