import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';
import { arrayToHashmap } from '@picsa/utils/data';

const TOOLS_DATA_BASE = {
  budget: { label: translateMarker('Budget'), url: '/budget' },
  climate: { label: translateMarker('Climate'), url: '/climate' },
  crop_probability: { label: translateMarker('Probability'), url: '/crop-probability' },
  farmer: { label: translateMarker('Farmer Activities'), url: '/farmer' },
  forecasts: { label: translateMarker('Forecasts'), url: '/forecasts' },
  option: { label: translateMarker('Options'), url: '/option' },
  manual: { label: translateMarker('Manual'), url: '/manual' },
  monitoring: { label: translateMarker('Monitoring'), url: '/monitoring' },
  resources: { label: translateMarker('Resources'), url: '/resources' },
  seasonal_calendar: { label: translateMarker('Seasonal Calendar'), url: '/seasonal-calendar' },
} as const;

// Extract list of available tools names
type IToolsID = keyof typeof TOOLS_DATA_BASE;

export const TOOLS_DATA = Object.entries(TOOLS_DATA_BASE).map(([id, { label, url }]) => {
  const iconData: IPicsaDataWithIcons = {
    assetIconPath: `assets/svgs/tools/${id}.svg`,
    svgIcon: id,
  };
  return {
    id: id as IToolsID,
    label: label as string,
    url,
    ...iconData,
  };
});

export type IToolsDataEntry = typeof TOOLS_DATA[0];

export const TOOLS_DATA_HASHMAP = arrayToHashmap(TOOLS_DATA, 'id') as Record<IToolsID, IToolsDataEntry>;
