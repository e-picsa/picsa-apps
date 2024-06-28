import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { IFarmerContent } from '../../types';
import { arrayToHashmap } from '@picsa/utils';

const CONTENT_STEPS: { [id in IFarmerContentId]: any } = {
  '0_intro': [],
  '1_what_you_do': [],
  '2_climate_change': [],
  '3_opportunities_risks': [],
  '4_what_are_the_options': [],
  '5_compare_options': [],
  '6_decide_and_plan': [],
  '7_use_forecasts': [],
};

const { budget, climate, options, probability_and_risk, resource_allocation_map, seasonal_calendar } =
  TOOLS_DATA_HASHMAP;

const FARMER_CONTENT_BASE = {
  '0_intro': {
    slug: 'intro',
    title: translateMarker('What is PICSA?'),
    tools: [],
    tags: [{ label: translateMarker('Tutorials') }],
  },
  '1_what_you_do': {
    slug: 'what-do-you-currently-do',
    title: translateMarker('What do you currently do?'),
    tools: [resource_allocation_map, seasonal_calendar],
    tags: [],
  },
  '2_climate_change': {
    slug: 'is-the-climate-changing',
    title: translateMarker('What is happening to the climate in your area?'),
    tools: [climate],
    tags: [],
  },
  '3_opportunities_risks': {
    slug: 'opportunities-and-risk',
    title: translateMarker('What are the opportunities and risk?'),
    tools: [probability_and_risk],
    tags: [],
  },
  '4_what_are_the_options': {
    slug: 'what-are-the-options',
    title: translateMarker('What changes can you make?'),
    tools: [options],
    tags: [],
  },
  '5_compare_options': {
    slug: 'compare-options',
    title: translateMarker('Are the changes a good idea?'),
    tools: [budget],
    tags: [],
  },
  '6_decide_and_plan': {
    slug: 'decide-and-plan',
    title: translateMarker('You decide and make a plan'),
    tools: [],
    tags: [],
  },
  '7_use_forecasts': {
    slug: 'use-forecasts',
    title: translateMarker('Use the forecasts to update and adapt your plans'),
    tools: [],
    tags: [],
  },
};

export type IFarmerContentId = keyof typeof FARMER_CONTENT_BASE;

export const FARMER_CONTENT_DATA: IFarmerContent[] = Object.entries(FARMER_CONTENT_BASE).map(([id, data]) => ({
  ...data,
  icon_path: `assets/svgs/farmer_content/${id}.svg`,
  id: id as IFarmerContentId,
  steps: CONTENT_STEPS[id],
}));
export const FARMER_CONTENT_DATA_BY_SLUG = arrayToHashmap(FARMER_CONTENT_DATA, 'slug') as {
  [code in IFarmerContentId]: IFarmerContent;
};
