import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IProbabilityToolOptions } from '@picsa/models';

export const PROBABILITY_TOOL_OPTIONS: IProbabilityToolOptions = {
  above: {
    label: translateMarker('Above'),
  },
  below: {
    label: translateMarker('Below'),
  },
};
