import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

definitions.extreme_rainfall_days.keys = ['sum_RD50' as any];

definitions.end.definition = 'Last occurrence between 1 Oct and 30 Apr with 10 mm rainfall';
definitions.extreme_rainfall_days.definition = 'Rainy days with at least 50mm';
definitions.length.definition = 'Number of days between start and end of the rains';
definitions.rainfall.definition = 'Total rainfall per year from start of the rains to end of the season';
definitions.start.definition =
  'First occurrence from 1 Oct with at least 25 mm of rainfall over 3 consecutive days (with no dry spell of length 9 in the next 21 days)';
definitions.temp_max.definition = 'The mean maximum and highest maximum daily temperatures per year';
definitions.temp_min.definition = 'The mean minimum and lowest minimum daily temperatures per year';

// Provide country-specific overrides for definitions and labels

export default definitions;
