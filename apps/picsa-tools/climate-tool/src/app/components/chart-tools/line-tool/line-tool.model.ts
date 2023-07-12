import { ILineToolOptions } from '@picsa/models';

enum colors {
  green = '#739b65',
  orange = '#bf7720',
  blue = 'blue',
  purple = 'purple',
}

export const LINE_TOOL_OPTIONS: ILineToolOptions = {
  enabled: true,
  above: {
    color: colors.purple,
  },
  below: {
    color: colors.blue,
  },
};
