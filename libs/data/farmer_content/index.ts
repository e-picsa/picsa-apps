import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';

/*******************************************************************
 * Farmer Tools
 ********************************************************************/
interface IToolData {
  id: IToolId;
  label: string;
}
// TODO - consider including svgIcons and using for extension tool also (refactor to folder and icon pack)
const TOOLS_BASE = {
  seasonal_calendar: { label: translateMarker('Seasonal Calendar') },
  resource_allocation_map: { label: translateMarker('Resource Allocation Map') },
  climate: { label: translateMarker('Climate') },
  probability_and_risk: { label: translateMarker('Probability and Risk') },
  options: { label: translateMarker('Options') },
};
type IToolId = keyof typeof TOOLS_BASE;

const TOOLS_DATA: IToolData[] = Object.entries(TOOLS_BASE).map(([id, data]) => ({ ...data, id: id as IToolId }));
const TOOLS_DATA_HASHMAP: Record<IToolId, IToolData> = arrayToHashmap(TOOLS_DATA, 'id');

/*******************************************************************
 * Farmer Content
 ********************************************************************/
export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
  steps: IFarmerContentStepVideo[];
}

interface IFarmerContentStepVideo {
  type: 'video';
}

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

const { seasonal_calendar, resource_allocation_map, climate, probability_and_risk, options } = TOOLS_DATA_HASHMAP;

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
    tools: [seasonal_calendar, resource_allocation_map],
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
    tools: [],
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
