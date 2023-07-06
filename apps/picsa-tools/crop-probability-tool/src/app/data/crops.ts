import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

/** List of all named crops used for type-checking */
export const CROPS_DATA = [
  { name: 'beans', label: translateMarker('Beans'), icon: 'assets/svgs/crops/beans.svg' },
  { name: 'cassava', label: translateMarker('Cassava'), icon: 'assets/svgs/crops/cassava.svg' },
  { name: 'cowpeas', label: translateMarker('Cowpeas'), icon: 'assets/svgs/crops/cowpeas.svg' },
  { name: 'groundnuts', label: translateMarker('Groundnuts'), icon: 'assets/svgs/crops/groundnuts.svg' },
  { name: 'maize', label: translateMarker('Maize'), icon: 'assets/svgs/crops/maize.svg' },
  { name: 'pigeon-peas', label: translateMarker('Pigeon Peas'), icon: 'assets/svgs/crops/pigeon-peas.svg' },
  { name: 'pumpkins', label: translateMarker('Pumpkins'), icon: 'assets/svgs/crops/pumpkins.svg' },
  { name: 'rice', label: translateMarker('Rice'), icon: 'assets/svgs/crops/rice.svg' },
  { name: 'sorghum', label: translateMarker('Sorghum'), icon: 'assets/svgs/crops/sorghum.svg' },
  { name: 'soya-beans', label: translateMarker('Soya Beans'), icon: 'assets/svgs/crops/soya-beans.svg' },
  { name: 'sweet-potatoes', label: translateMarker('Sweet Potatoes'), icon: 'assets/svgs/crops/sweet-potatoes.svg' },
  { name: 'sunflower', label: translateMarker('Sunflower'), icon: 'assets/svgs/crops/sunflower.svg' },
] as const;

// type-defintions extracted from hardcoded data
export type ICropData = typeof CROPS_DATA[number];
export type ICropName = typeof CROPS_DATA[number]['name'];
