import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';
import { IChartMeta } from '@picsa/models';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { ToolSelectComponent } from './tool-select.component';

describe('ToolSelectComponent', () => {
  let component: ToolSelectComponent;
  let fixture: ComponentFixture<ToolSelectComponent>;
  const mockChartDefinition = signal<IChartMeta | undefined>(undefined);

  beforeEach(async () => {
    mockChartDefinition.set(undefined);

    await TestBed.configureTestingModule({
      imports: [ToolSelectComponent, PicsaTranslateModule.forRoot()],
      providers: [
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

  it('should return all 4 tools when chartDefinition has all tools enabled', () => {
    mockChartDefinition.set({
      _id: 'rainfall',
      tools: {
        line: { enabled: true, above: { color: 'green' }, below: { color: 'orange' } },
        probability: { enabled: true, above: { label: 'Above' }, below: { label: 'Below' } },
        terciles: { enabled: true },
        el_nino: { enabled: true },
        la_nina: { enabled: true },
      },
    } as any);

    const tools = component.tools();
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(['line', 'terciles', 'el_nino', 'la_nina']);
  });

  it('should exclude line and terciles tools when disabled on temperature charts', () => {
    mockChartDefinition.set({
      _id: 'temp_min',
      tools: {
        line: { enabled: false, above: { color: 'green' }, below: { color: 'orange' } },
        terciles: { enabled: false },
        el_nino: { enabled: true },
        la_nina: { enabled: true },
      },
    } as any);

    const tools = component.tools();
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(['el_nino', 'la_nina']);
  });
});
