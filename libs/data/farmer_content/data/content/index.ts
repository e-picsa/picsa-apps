import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { IFarmerContent } from '../../types';
import { arrayToHashmap } from '@picsa/utils';

import what_you_do from './1_what_you_do';

const { budget, climate, options, probability_and_risk, resource_allocation_map, seasonal_calendar } =
  TOOLS_DATA_HASHMAP;

const FARMER_CONTENT_BASE = {
  '0_intro': {
    slug: 'intro',
    title: translateMarker('What is PICSA?'),
    tools: [],
    tags: [{ label: translateMarker('Tutorials') }],
    steps: [],
  },
  '1_what_you_do': what_you_do,
  '2_climate_change': {
    slug: 'is-the-climate-changing',
    title: translateMarker('What is happening to the climate in your area?'),
    tools: [climate],
    tags: [],
    steps: [],
  },
  '3_opportunities_risks': {
    slug: 'opportunities-and-risk',
    title: translateMarker('What are the opportunities and risk?'),
    tools: [probability_and_risk],
    tags: [],
    steps: [],
  },
  '4_what_are_the_options': {
    slug: 'what-are-the-options',
    title: translateMarker('What changes can you make?'),
    tools: [options],
    tags: [],
    steps: [],
  },
  '5_compare_options': {
    slug: 'compare-options',
    title: translateMarker('Are the changes a good idea?'),
    tools: [budget],
    tags: [],
    steps: [],
  },
  '6_decide_and_plan': {
    slug: 'decide-and-plan',
    title: translateMarker('You decide and make a plan'),
    tools: [],
    tags: [],
    steps: [],
  },
  '7_use_forecasts': {
    slug: 'use-forecasts',
    title: translateMarker('Use the forecasts to update and adapt your plans'),
    tools: [],
    tags: [],
    steps: [],
  },
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
