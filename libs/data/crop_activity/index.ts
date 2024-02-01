import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';
import { arrayToHashmap } from '@picsa/utils/data';

const CROP_ACTIVITY_BASE = {
  fertiliser_apply: { label: translateMarker('Apply Fertiliser') },
  land_preparation: { label: translateMarker('Land Preparation') },
  sowing: { label: translateMarker('Sowing') },
  watering: { label: translateMarker('Watering') },
  weeding: { label: translateMarker('Weeding') },
} as const;

// Extract list of available weather names
type CropActivityName = keyof typeof CROP_ACTIVITY_BASE;
export type ICropActivityDataEntry = typeof CROP_ACTIVITY_DATA[0];

// TODO - migrate budget tool to use
export const CROP_ACTIVITY_DATA = Object.entries(CROP_ACTIVITY_BASE).map(([id, { label }]) => {
  const data: IPicsaDataWithIcons = {
    assetIconPath: `assets/svgs/crop_activity/${id}.svg`,
    svgIcon: id,
  };
  return {
    id: id as CropActivityName,
    label: label as string,
    ...data,
  };
});

export const CROP_ACTIVITY_HASHMAP = arrayToHashmap(CROP_ACTIVITY_DATA, 'id');

// TODO - should ideally migrate budget and include mapped options
/**
 [ 'build-housing',
  'dipping',
  'feeding-livestock',
  'provide-supplements',
  'provide-water',
  'relocation',
  'transport-livestock',
  'vaccinate',
  'apply-fertiliser',
  'apply-pesticide',
  'bagging',
  'banding',
  'compost-manure-making',
  'harvesting',
  'land-clearing',
  'mulching',
  'ploughing',
  'post-harvest-handling',
  'shelling',
  'sowing',
  'storage',
  'threshing',
  'transport',
  'watering',
  'weeding',
  'marketing-and-selling',
  'value-addition',
  'purchase' ]
 */
