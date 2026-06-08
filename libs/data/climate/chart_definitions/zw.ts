import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

// Provide country-specific overrides for definitions and labels

definitions.start.definition =
  'First occasion, after start of rains and before 31 Jan with more than 20mm rain in 3 days and no dry spell longer than 10 days in the next 21 days';

definitions.end.definition =
  'First occasion, after end of rains and before 30 June when soil moisture level is less than zero';

export default definitions;
