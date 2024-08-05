import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';
import { IPicsaDataWithIcons } from '../models';

const CROPS_DATA_BASE = {
  avocado: { label: translateMarker('Avocado'), icon: 'assets/svgs/crops/avocado.svg' },
  beans: { label: translateMarker('Beans'), icon: 'assets/svgs/crops/beans.svg' },
  cassava: { label: translateMarker('Cassava'), icon: 'assets/svgs/crops/cassava.svg' },
  cotton: { label: translateMarker('Cotton'), icon: 'assets/svgs/crops/cotton.svg' },
  cowpeas: { label: translateMarker('Cowpeas'), icon: 'assets/svgs/crops/cowpeas.svg' },
  groundnuts: { label: translateMarker('Groundnuts'), icon: 'assets/svgs/crops/groundnuts.svg' },
  maize: { label: translateMarker('Maize'), icon: 'assets/svgs/crops/maize.svg' },
  mangoes: { label: translateMarker('Mangoes'), icon: 'assets/svgs/crops/mangoes.svg' },
  onions: { label: translateMarker('Onions'), icon: 'assets/svgs/crops/onions.svg' },
  paprika: { label: translateMarker('Paprika'), icon: 'assets/svgs/crops/paprika.svg' },
  // TODO - add icon
  'pearl-millet': { label: translateMarker('Pearl Millet'), icon: '' },
  'paw-paw': { label: translateMarker('Paw-paw'), icon: 'assets/svgs/crops/paw-paw.svg' },
  'pigeon-peas': { label: translateMarker('Pigeon Peas'), icon: 'assets/svgs/crops/pigeon-peas.svg' },
  potato: { label: translateMarker('Potatoes'), icon: 'assets/svgs/crops/potato.svg' },
  pumpkins: { label: translateMarker('Pumpkins'), icon: 'assets/svgs/crops/pumpkins.svg' },
  rice: { label: translateMarker('Rice'), icon: 'assets/svgs/crops/rice.svg' },
  sesame: { label: translateMarker('Sesame'), icon: 'assets/svgs/crops/sesame.svg' },
  sorghum: { label: translateMarker('Sorghum'), icon: 'assets/svgs/crops/sorghum.svg' },
  'soya-beans': { label: translateMarker('Soya Beans'), icon: 'assets/svgs/crops/soya-beans.svg' },
  sunflower: { label: translateMarker('Sunflower'), icon: 'assets/svgs/crops/sunflower.svg' },
  'sweet-potatoes': { label: translateMarker('Sweet Potatoes'), icon: 'assets/svgs/crops/sweet-potatoes.svg' },
  tobacco: { label: translateMarker('Tobacco'), icon: 'assets/svgs/crops/tobacco.svg' },
  tomatoes: { label: translateMarker('Tomatoes'), icon: 'assets/svgs/crops/tomatoes.svg' },
} as const;

type ICropID = keyof typeof CROPS_DATA_BASE;

/** List of all named crops used for type-checking */
export const CROPS_DATA = Object.entries(CROPS_DATA_BASE).map(([id, entry]) => {
  const iconData: IPicsaDataWithIcons = {
    assetIconPath: `assets/svgs/crops/${id}.svg`,
    svgIcon: id,
  };
  return {
    id: id as ICropID,
    label: entry.label as string,
    ...iconData,
    // hack - legacy data uses 'name' for ids and 'icon' for 'assetIconPath'
    name: id,
    icon: `assets/svgs/crops/${id}.svg`,
  };
});

export const CROPS_DATA_HASHMAP = arrayToHashmap(CROPS_DATA, 'name');

// type-defintions extracted from hardcoded data
export type ICropData = typeof CROPS_DATA[number];
export type ICropName = keyof typeof CROPS_DATA_BASE;
