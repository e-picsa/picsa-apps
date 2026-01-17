import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

// Provide country-specific overrides for definitions and labels
definitions.rainfall.definition = translateMarker(
  'Seasonal total rainfall calculated between the defined start and defined end of the season',
);
definitions.length.definition = translateMarker(
  'Calculated with the date range of Start of rains and End of the rains',
);
definitions.start.definition = translateMarker(
  'First 3 days receiving rainfall amount of 20mm and not followed by 9-day dry spell for the next 21 days',
);
definitions.end.definition = translateMarker(
  'Capacity of 100mm on 1st March reduces 0.5 with evaporation rate of 5mm per day',
);

export default definitions;
