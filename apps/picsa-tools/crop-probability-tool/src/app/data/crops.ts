/** List of all named crops used for type-checking */
export const CROPS_DATA = [
  { name: 'beans', label: 'Beans', icon: 'assets/svgs/crops/beans.svg' },
  { name: 'cassava', label: 'Cassava', icon: 'assets/svgs/crops/cassava.svg' },
  { name: 'cowpeas', label: 'Cowpeas', icon: 'assets/svgs/crops/cowpeas.svg' },
  { name: 'groundnuts', label: 'Groundnuts', icon: 'assets/svgs/crops/groundnuts.svg' },
  { name: 'maize', label: 'Maize', icon: 'assets/svgs/crops/maize.svg' },
  { name: 'pigeon-peas', label: 'Pigeon Peas', icon: 'assets/svgs/crops/pigeon-peas.svg' },
  { name: 'pumpkins', label: 'Pumpkins', icon: 'assets/svgs/crops/pumpkins.svg' },
  { name: 'rice', label: 'Rice', icon: 'assets/svgs/crops/rice.svg' },
  { name: 'sorghum', label: 'Sorghum', icon: 'assets/svgs/crops/sorghum.svg' },
  { name: 'soya-beans', label: 'Soya Beans', icon: 'assets/svgs/crops/soya-beans.svg' },
  { name: 'sweet-potatoes', label: 'Sweet Potatoes', icon: 'assets/svgs/crops/sweet-potatoes.svg' },
  { name: 'sunflower', label: 'Sunflower', icon: 'assets/svgs/crops/sunflower.svg' },
] as const;

// type-defintions extracted from hardcoded data
export type ICropData = typeof CROPS_DATA[number];
export type ICropName = typeof CROPS_DATA[number]['name'];
