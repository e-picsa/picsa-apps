import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

definitions.end.definition =
  'First occasion, after end of rains and before 30 June when soil moisture level is less than zero';
definitions.extreme_rainfall_days.definition = '';
definitions.length.definition = 'Number of days from Start of Season to End of Season';
definitions.rainfall.definition = 'Seasonal rainfall totalled from 1 Oct to 30 Apr';
definitions.start.definition = 'First occasion, from 1 Oct to 31 Jan, with more than 20 mm of rainfall in 3 days';
definitions.temp_max.definition = 'The mean maximum and highest maximum daily temperatures per year';
definitions.temp_min.definition = 'The mean minimum and lowest minimum daily temperatures per year';

export default definitions;
