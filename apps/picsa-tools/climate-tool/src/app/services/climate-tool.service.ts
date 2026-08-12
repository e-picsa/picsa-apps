import { Injectable, signal } from '@angular/core';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

type IToolName = 'line' | 'terciles' | 'el_nino';

interface IClimateTool {
  name: IToolName;
  label: string;
  icon: string;
  /** Optionally shared value if required by other tools */
  value?: any;
}

const TOOL_DEFAULTS: { [key in IToolName]: IClimateTool } = {
  line: {
    name: 'line',
    label: translateMarker('Line'),
    icon: 'assets/climate-tools/line-tool.svg',
    value: 0,
  },
  terciles: {
    name: 'terciles',
    label: translateMarker('Terciles'),
    icon: 'assets/climate-tools/tercile-tool.svg',
  },
  el_nino: {
    name: 'el_nino',
    label: translateMarker('El Niño') + ' / ' + translateMarker('La Niña'),
    icon: 'assets/climate-tools/el-nino-tool.svg',
  },
};

@Injectable({ providedIn: 'root' })
export class ClimateToolService {
  public tools = signal(TOOL_DEFAULTS);

  /** Currently active tool name, or undefined if all tools are disabled */
  public activeTool = signal<IToolName | undefined>(undefined);

  public disableAll() {
    this.activeTool.set(undefined);
  }

  public toggleEnabled(tool: IToolName) {
    this.activeTool.update((current) => (current === tool ? undefined : tool));
  }

  public setValue(tool: IToolName, value: any) {
    this.tools.update((t) => ({
      ...t,
      [tool]: { ...t[tool], value },
    }));
  }
}

/**
 * Returns the value at a given percentile in a sorted numeric array.
 * "Linear interpolation between closest ranks" method
 * https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
 *
 * @param p percentile to calculate, as a decimal between 0 and 1
 */
export function calcPercentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 1) return arr[arr.length - 1];
  arr = arr.sort((a, b) => a - b).filter((v) => v !== undefined);
  const index = (arr.length - 1) * p;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= arr.length) return arr[lower];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}
