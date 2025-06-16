import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';
import { arrayToHashmap } from '@picsa/utils/data';

const CROP_ACTIVITY_BASE = {
  fertiliser_apply: { label: translateMarker('Apply Fertiliser') },
  land_preparation: { label: translateMarker('Land Preparation') },
  sowing: { label: translateMarker('Sowing') },
  watering: { label: translateMarker('Watering') },
  weeding: { label: translateMarker('Weeding') },
  // updates
  bagging: { label: translateMarker('bagging'), pngIcon: true },
  banding: { label: translateMarker('banding') },
  compost_manure_making: { label: translateMarker('compost manure making'), pngIcon: true },
  harvesting: { label: translateMarker('harvesting') },
  land_clearing: { label: translateMarker('land clearing') },
  marketing_and_selling: { label: translateMarker('marketing and selling') },
  mulching: { label: translateMarker('mulching'), pngIcon: true },
  pesticide_apply: { label: translateMarker('apply pesticide') },
  ploughing: { label: translateMarker('ploughing') },
  post_harvest_handling: { label: translateMarker('post-harvest handling') },
  shelling: { label: translateMarker('shelling'), pngIcon: true },
  storage: { label: translateMarker('storage') },
  threshing: { label: translateMarker('threshing'), pngIcon: true },
  transport: { label: translateMarker('transport') },
  value_addition: { label: translateMarker('value addition') },
  // TODO - should ideally migrate budget and include mapped options
} as const;

// Extract list of available weather names
type CropActivityName = keyof typeof CROP_ACTIVITY_BASE;
export type ICropActivityDataEntry = typeof CROP_ACTIVITY_DATA[0];

// TODO - migrate budget tool to use
export const CROP_ACTIVITY_DATA = Object.entries(CROP_ACTIVITY_BASE)
  .map(([id, entry]) => {
    const assetIconPath = `assets/svgs/crop_activity/${id}.svg`;
    const data: IPicsaDataWithIcons = { assetIconPath, svgIcon: id };
    // HACK - include png icons while pending new svgs
    if (entry['pngIcon']) {
      data.assetIconPath = `assets/svgs/crop_activity/${id}.png`;
      data.svgIcon = '';
    }
    return {
      id: id as CropActivityName,
      label: entry.label as string,
      ...data,
    };
  })
  .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));

export const CROP_ACTIVITY_HASHMAP = arrayToHashmap(CROP_ACTIVITY_DATA, 'id');
