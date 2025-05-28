import { IFarmerContent } from '../../types';
import { arrayToHashmap } from '@picsa/utils';

import intro from './0_intro';
import what_you_do from './1_what_you_do';
import climate_change from './2_climate_change';
import opportunities_risks from './3_opportunities_risks';
import what_are_the_options from './4_what_are_the_options';
import compare_options from './5_compare_options';
import decide_and_plan from './6_decide_and_plan';
import use_forecasts from './7_use_forecasts';
import beyond_picsa from './8_beyond_picsa';

const FARMER_CONTENT_BASE = {
  '0_intro': intro,
  '1_what_you_do': what_you_do,
  '2_climate_change': climate_change,
  '3_opportunities_risks': opportunities_risks,
  '4_what_are_the_options': what_are_the_options,
  '5_compare_options': compare_options,
  '6_decide_and_plan': decide_and_plan,
  '7_use_forecasts': use_forecasts,
  '8_beyond_picsa': beyond_picsa,
};

export type IFarmerContentId = keyof typeof FARMER_CONTENT_BASE;

export const FARMER_CONTENT_DATA: IFarmerContent[] = Object.entries(FARMER_CONTENT_BASE).map(([id, data]) => ({
  ...data,
  icon_path: `assets/svgs/farmer_content/${id}.svg`,
  id: id as IFarmerContentId,
}));
export const FARMER_CONTENT_DATA_BY_SLUG = arrayToHashmap(FARMER_CONTENT_DATA, 'slug') as {
  [code in IFarmerContentId]: IFarmerContent;
};
