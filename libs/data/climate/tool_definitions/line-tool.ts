import { ILineToolOptions } from '@picsa/models';

export enum LINE_TOOL_COLORS {
  green = '#739b65',
  orange = '#bf7720',
  red = '#9a6565',
  purple = '#76659a',
}

export const LINE_TOOL_OPTIONS: ILineToolOptions = {
  enabled: true,
  above: {
    color: LINE_TOOL_COLORS.green,
  },
  below: {
    color: LINE_TOOL_COLORS.orange,
  },
};
