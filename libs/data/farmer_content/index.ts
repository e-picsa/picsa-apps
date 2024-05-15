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
 * Farmer Steps
 ********************************************************************/
interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  step_number: number;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
}

const { seasonal_calendar, resource_allocation_map, climate, probability_and_risk, options } = TOOLS_DATA_HASHMAP;

const FARMER_CONTENT_BASE = {
  intro: {
    slug: 'intro',
    step_number: 1,
    title: translateMarker('What is PICSA?'),
    tools: [],
    tags: [{ label: translateMarker('Tutorials') }],
  },
  what_does_the_farmer_do: {
    slug: 'what-do-you-currently-do',
    step_number: 2,
    title: 'What do you currently do?',
    tools: [seasonal_calendar, resource_allocation_map],
    tags: [],
  },
  climate_change: {
    slug: 'is-the-climate-changing',
    step_number: 3,
    title: translateMarker('Is your climate changing?'),
    tools: [climate],
    tags: [],
  },
  opportunities_risks: {
    slug: 'opportunities-and-risk',
    step_number: 4,
    title: translateMarker('What are the opportunities and risk?'),
    tools: [probability_and_risk],
    tags: [],
  },
  what_are_the_options: {
    slug: 'what-are-the-options',
    step_number: 5,
    title: 'What changes can you make?',
    tools: [options],
    tags: [],
  },
  compare_options: {
    slug: 'compare-options',
    step_number: 5,
    title: 'Are the changes a good idea?',
    tools: [],
    tags: [],
  },
};
export type IFarmerContentId = keyof typeof FARMER_CONTENT_BASE;
export const FARMER_CONTENT_DATA: IFarmerContent[] = Object.entries(FARMER_CONTENT_BASE).map(([id, data]) => ({
  ...data,
  icon_path: `assets/svgs/farmer_content/${id}.svg`,
  id: id as IFarmerContentId,
}));
export const FARMER_CONTENT_DATA_HASHMAP = arrayToHashmap(FARMER_CONTENT_DATA, 'id') as {
  [code in IFarmerContentId]: IFarmerContent;
};
