import { Injectable } from '@angular/core';

type IToolName = 'line' | 'terciles';

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
    label: 'Line',
    icon: 'assets/climate-tools/line-tool.svg',
    value: 0,
  },
  terciles: {
    name: 'terciles',
    label: 'Terciles',
    icon: 'assets/climate-tools/tercile-tool.svg',
  },
};

@Injectable({ providedIn: 'root' })
export class ClimateToolService {
  public tools = TOOL_DEFAULTS;

  /** Track enabled tools separately to other settings for easier change detection */
  public enabled: { [key in IToolName]: boolean } = {
    line: false,
    terciles: false,
  };

  public toggleEnabled(tool: IToolName) {
    this.enabled[tool] = !this.enabled[tool];
  }

  public setValue(tool: IToolName, value: any) {
    this.tools[tool].value = value;
  }
}
