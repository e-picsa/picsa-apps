import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';

import what_do_you_currently_do from './2-what-do-you-currently-do';

import { TOOLS_DATA_HASHMAP } from '../tools';
import { IFarmerContent } from '../types';

const { climate, options, probability_and_risk } = TOOLS_DATA_HASHMAP;

const FARMER_CONTENT_BASE = {
  intro: {
    slug: 'intro',
    title: translateMarker('What is PICSA?'),
    tools: [],
    tags: [{ label: translateMarker('Tutorials') }],
    content: [],
  },
  what_do_you_currently_do,
  climate_change: {
    slug: 'is-the-climate-changing',
    title: translateMarker('Is your climate changing?'),
    tools: [climate],
    tags: [],
    content: [],
  },
  opportunities_risks: {
    slug: 'opportunities-and-risk',
    title: translateMarker('What are the opportunities and risk?'),
    tools: [probability_and_risk],
    tags: [],
    content: [],
  },
  what_are_the_options: {
    slug: 'what-are-the-options',
    title: translateMarker('What changes can you make?'),
    tools: [options],
    tags: [],
    content: [],
  },
  compare_options: {
    slug: 'compare-options',
    title: translateMarker('Are the changes a good idea?'),
    tools: [],
    tags: [],
    content: [],
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
