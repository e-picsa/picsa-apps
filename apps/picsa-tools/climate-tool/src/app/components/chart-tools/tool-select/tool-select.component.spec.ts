import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { ClimateToolService } from '../../../services/climate-tool.service';
import { ToolSelectComponent } from './tool-select.component';

describe('ToolSelectComponent', () => {
  let component: ToolSelectComponent;
  let fixture: ComponentFixture<ToolSelectComponent>;
  let mockChartDefinition: ReturnType<typeof signal<IChartMeta | undefined>>;

  beforeEach(async () => {
    mockChartDefinition = signal<IChartMeta | undefined>(undefined);

    await TestBed.configureTestingModule({
      imports: [ToolSelectComponent, PicsaTranslateModule.forRoot()],
      providers: [
        ClimateToolService,
        {
          provide: ClimateChartService,
          useValue: {
            chartDefinition: mockChartDefinition,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return all 5 tools when chartDefinition has all tools enabled', () => {
    mockChartDefinition.set({
      _id: 'rainfall',
      tools: {
        line: { enabled: true, above: { color: 'green' }, below: { color: 'orange' } },
        probability: { enabled: true, above: { label: 'Above' }, below: { label: 'Below' } },
        terciles: { enabled: true },
        trendline: { enabled: true },
        el_nino: { enabled: true },
        la_nina: { enabled: true },
      },
    } as any);

    const tools = component.tools();
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(['line', 'terciles', 'trendline', 'el_nino', 'la_nina']);
  });

  it('should exclude line and terciles tools when disabled on temperature charts, but keep trendline', () => {
    mockChartDefinition.set({
      _id: 'temp_min',
      tools: {
        line: { enabled: false, above: { color: 'green' }, below: { color: 'orange' } },
        terciles: { enabled: false },
        trendline: { enabled: true },
        el_nino: { enabled: true },
        la_nina: { enabled: true },
      },
    } as any);

    const tools = component.tools();
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(['trendline', 'el_nino', 'la_nina']);
  });

  it('should exclude trendline when explicitly disabled', () => {
    mockChartDefinition.set({
      _id: 'rainfall',
      tools: {
        line: { enabled: true },
        terciles: { enabled: true },
        trendline: { enabled: false },
        el_nino: { enabled: true },
        la_nina: { enabled: true },
      },
    } as any);

    const tools = component.tools();
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(['line', 'terciles', 'el_nino', 'la_nina']);
  });
});
