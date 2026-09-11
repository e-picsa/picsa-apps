import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import type { IChartMeta } from '@picsa/models';
import { DataPoint } from 'c3';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { ElNinoToolComponent, LaNinaToolComponent } from './el-nino-tool.component';

describe('EnsoToolComponents', () => {
  let chartService: ClimateChartService;

  const sampleMeta: IChartMeta = {
    _id: 'rainfall',
    name: 'Seasonal Rainfall',
    shortname: 'Rain',
    keys: ['Rainfall'],
    colors: ['#377eb8'],
    yFormat: 'value',
    yLabel: 'Seasonal Total Rainfall (mm)',
    xLabel: '',
    xVar: 'Year',
    axes: {
      yMin: 0,
      yMax: 1500,
      xMin: 1950,
      xMax: 2025,
      xMinor: 1,
      xMajor: 2,
      yMinor: 100,
      yMajor: 200,
    },
    units: 'mm',
    definition: '',
    image: '',
    tools: {},
  };

  const sampleData = [
    { Year: 1982, Rainfall: 500 }, // El Nino Very Strong (grade 4)
    { Year: 1972, Rainfall: 520 }, // El Nino Strong (grade 3)
    { Year: 1963, Rainfall: 540 }, // El Nino Moderate (grade 2)
    { Year: 1951, Rainfall: 560 }, // El Nino Weak (grade 1)
    { Year: 1973, Rainfall: 700 }, // La Nina Strong (grade 3)
    { Year: 1955, Rainfall: 720 }, // La Nina Moderate (grade 2)
    { Year: 1954, Rainfall: 680 }, // La Nina Weak (grade 1)
    { Year: 1960, Rainfall: 600 }, // Neutral
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElNinoToolComponent, LaNinaToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    chartService = TestBed.inject(ClimateChartService);
    chartService.chartDefinition.set(sampleMeta);
    chartService.chartData.set(sampleData);
    chartService.timespanMode.set('annual');
  });

  describe('ElNinoToolComponent', () => {
    let component: ElNinoToolComponent;
    let fixture: ComponentFixture<ElNinoToolComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(ElNinoToolComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and initialize with Weak grade disabled and Moderate/Strong/Very Strong selected', () => {
      expect(component).toBeTruthy();
      expect(component.label).toBe('El Niño');
      expect(component.symbol).toBe('▲');
      expect(component.category).toBe('el_nino');
      expect(component.availableGrades.length).toBe(4);
      expect(component.selectedGrades().size).toBe(3);
      expect(component.isGradeSelected(1)).toBe(false);
      expect(component.isGradeSelected(2)).toBe(true);
      expect(component.isGradeSelected(3)).toBe(true);
      expect(component.isGradeSelected(4)).toBe(true);
    });

    it('should provide NOAA RONI data source link and attribution', () => {
      expect(component.dataSource.url).toBe('https://ggweather.com/enso/roni.htm');
      expect(component.dataSource.title).toContain('RONI');
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('.source-link') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://ggweather.com/enso/roni.htm');
    });

    it('should calculate active dataset counts for displayItems with Weak unselected initially', () => {
      const items = component.displayItems();
      expect(items.length).toBe(4);
      for (const item of items) {
        expect(item.count).toBe(1);
        if (item.grade === 1) {
          expect(item.isSelected).toBe(false);
        } else {
          expect(item.isSelected).toBe(true);
        }
      }
    });

    it('should assign distinct sizes and colors to each El Niño grade in getPointStyle', () => {
      const p1982 = component.getPointStyle({ x: 1982, value: 500 } as DataPoint); // Very Strong (4)
      const p1972 = component.getPointStyle({ x: 1972, value: 520 } as DataPoint); // Strong (3)
      const p1963 = component.getPointStyle({ x: 1963, value: 540 } as DataPoint); // Moderate (2)
      const p1951Disabled = component.getPointStyle({ x: 1951, value: 560 } as DataPoint); // Weak (1) initially disabled
      const p1960 = component.getPointStyle({ x: 1960, value: 600 } as DataPoint); // Neutral

      expect(p1982?.shape).toBe('triangle');
      expect(p1982?.size).toBe(12.5);
      expect(p1982?.fill).toBe('#8c1b07');

      expect(p1972?.shape).toBe('triangle');
      expect(p1972?.size).toBe(10.0);
      expect(p1972?.fill).toBe('#c44601');

      expect(p1963?.shape).toBe('triangle');
      expect(p1963?.size).toBe(7.5);
      expect(p1963?.fill).toBe('#f59338');

      // Weak is disabled initially, so it renders neutral
      expect(p1951Disabled?.shape).toBe('circle');

      // Enable Weak
      component.toggleGrade(1);
      const p1951Active = component.getPointStyle({ x: 1951, value: 560 } as DataPoint);
      expect(p1951Active?.shape).toBe('triangle');
      expect(p1951Active?.size).toBe(4.5);
      expect(p1951Active?.fill).toBe('#fed8a6');

      // Neutral point should use neutralStyle
      expect(p1960?.shape).toBe('circle');
      expect(p1960?.size).toBe(4);
    });

    it('should ignore non-decoratable data points (null, NaN, out-of-dataset years)', () => {
      expect(component.getPointStyle({ x: 1982, value: null } as unknown as DataPoint)).toBeUndefined();
      expect(component.getPointStyle({ x: 1982, value: Number.NaN } as unknown as DataPoint)).toBeUndefined();
      expect(component.getPointStyle({ x: 1800, value: 500 } as unknown as DataPoint)).toBeUndefined();
    });

    it('should dynamically adapt point styles when grades are toggled', () => {
      // Toggle off Very Strong (grade 4)
      component.toggleGrade(4);
      expect(component.isGradeSelected(4)).toBe(false);

      // 1982 should now return neutral style
      const p1982 = component.getPointStyle({ x: 1982, value: 500 } as DataPoint);
      expect(p1982?.shape).toBe('circle');

      // 1972 (grade 3) should still return Strong style
      const p1972 = component.getPointStyle({ x: 1972, value: 520 } as DataPoint);
      expect(p1972?.shape).toBe('triangle');
      expect(p1972?.size).toBe(10.0);

      // Re-enable grade 4
      component.toggleGrade(4);
      expect(component.isGradeSelected(4)).toBe(true);
      const p1982Restored = component.getPointStyle({ x: 1982, value: 500 } as DataPoint);
      expect(p1982Restored?.shape).toBe('triangle');
      expect(p1982Restored?.size).toBe(12.5);
    });

    it('should support selectAllGrades and clearAllGrades', () => {
      component.clearAllGrades();
      expect(component.selectedGrades().size).toBe(0);
      const p1982 = component.getPointStyle({ x: 1982, value: 500 } as DataPoint);
      expect(p1982?.shape).toBe('circle');

      component.selectAllGrades();
      expect(component.selectedGrades().size).toBe(4);
      const p1982Active = component.getPointStyle({ x: 1982, value: 500 } as DataPoint);
      expect(p1982Active?.shape).toBe('triangle');
    });

    it('should format tooltip row with grade name in annual mode', () => {
      const tooltip = component.formatTooltipRow(1982);
      expect(tooltip).toBeDefined();
      expect(tooltip?.text).toBe('▲ El Niño (Very Strong)');
      expect(tooltip?.color).toBe('#8c1b07');

      const neutralTooltip = component.formatTooltipRow(1960);
      expect(neutralTooltip).toBeUndefined();

      // Non-dataset year should return undefined
      expect(component.formatTooltipRow(1850)).toBeUndefined();
    });

    it('should format tooltip row with 3-month RONI SST anomaly value in three_month mode', () => {
      chartService.timespanMode.set('three_month');
      chartService.selectedPeriod.set({ id: 'ond', code: 'OND', months: [10, 11, 12] });

      const tooltip = component.formatTooltipRow(1982);
      expect(tooltip).toBeDefined();
      expect(tooltip?.text).toContain('▲ El Niño (Very Strong)');
      expect(tooltip?.text).toContain('OND: +2.43°C');
      expect(tooltip?.color).toBe('#8c1b07');

      // For a neutral year in 3-month mode, display the RONI anomaly for context
      const neutralTooltip = component.formatTooltipRow(1960);
      expect(neutralTooltip).toBeDefined();
      expect(neutralTooltip?.text).toBe('RONI (OND): -0.08°C');
      expect(neutralTooltip?.color).toBe('#64748b');
    });

    it('should return legend items matching selected grades plus neutral', () => {
      const items = component.getLegendItems();
      expect(items.length).toBe(4); // 3 active grades (Moderate, Strong, Very Strong) + neutral
      expect(items.map((i) => i.label)).toEqual([
        'El Niño (Moderate)',
        'El Niño (Strong)',
        'El Niño (Very Strong)',
        'Neutral / Other',
      ]);

      // Toggling grade 1 (Weak) on should add it to legend
      component.toggleGrade(1);
      const withWeak = component.getLegendItems();
      expect(withWeak.length).toBe(5);
      expect(withWeak.find((i) => i.label === 'El Niño (Weak)')).toBeDefined();
    });

    it('should render a compact layout without headers, counts, neutral indicators or long explanations', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.enso-header')).toBeFalsy();
      expect(el.querySelector('.neutral-chip')).toBeFalsy();
      expect(el.querySelector('.source-hint')).toBeFalsy();
      expect(el.querySelector('.grade-count')).toBeFalsy();
      expect(el.querySelectorAll('.grade-chip').length).toBe(4);
      expect(el.querySelector('.source-link')).toBeTruthy();
    });
  });

  describe('LaNinaToolComponent', () => {
    let component: LaNinaToolComponent;
    let fixture: ComponentFixture<LaNinaToolComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(LaNinaToolComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create and initialize with Weak grade disabled and Moderate/Strong selected', () => {
      expect(component).toBeTruthy();
      expect(component.label).toBe('La Niña');
      expect(component.symbol).toBe('■');
      expect(component.category).toBe('la_nina');
      expect(component.availableGrades.length).toBe(3);
      expect(component.selectedGrades().size).toBe(2);
      expect(component.isGradeSelected(1)).toBe(false);
      expect(component.isGradeSelected(2)).toBe(true);
      expect(component.isGradeSelected(3)).toBe(true);
    });

    it('should assign distinct sizes and colors to each La Niña grade in getPointStyle', () => {
      const p1973 = component.getPointStyle({ x: 1973, value: 700 } as DataPoint); // Strong (3)
      const p1955 = component.getPointStyle({ x: 1955, value: 720 } as DataPoint); // Moderate (2)
      const p1954Disabled = component.getPointStyle({ x: 1954, value: 680 } as DataPoint); // Weak (1) initially disabled
      const p1960 = component.getPointStyle({ x: 1960, value: 600 } as DataPoint); // Neutral

      expect(p1973?.shape).toBe('square');
      expect(p1973?.size).toBe(11.0);
      expect(p1973?.fill).toBe('#0e457b');

      expect(p1955?.shape).toBe('square');
      expect(p1955?.size).toBe(7.5);
      expect(p1955?.fill).toBe('#348be8');

      // Weak disabled renders neutral
      expect(p1954Disabled?.shape).toBe('circle');

      // Enable Weak
      component.toggleGrade(1);
      const p1954Active = component.getPointStyle({ x: 1954, value: 680 } as DataPoint);
      expect(p1954Active?.shape).toBe('square');
      expect(p1954Active?.size).toBe(4.5);
      expect(p1954Active?.fill).toBe('#bae0fd');

      expect(p1960?.shape).toBe('circle');
    });

    it('should format tooltip row with grade name and 3-month anomaly', () => {
      const annualTooltip = component.formatTooltipRow(1973);
      expect(annualTooltip?.text).toBe('■ La Niña (Strong)');
      expect(annualTooltip?.color).toBe('#0e457b');

      chartService.timespanMode.set('three_month');
      chartService.selectedPeriod.set({ id: 'ond', code: 'OND', months: [10, 11, 12] });
      const threeMonthTooltip = component.formatTooltipRow(1973);
      expect(threeMonthTooltip?.text).toContain('■ La Niña (Strong)');
      expect(threeMonthTooltip?.text).toContain('OND: -1.95°C');
    });

    it('should toggle grades and update point styles accordingly', () => {
      component.toggleGrade(3);
      expect(component.isGradeSelected(3)).toBe(false);

      const p1973 = component.getPointStyle({ x: 1973, value: 700 } as DataPoint);
      expect(p1973?.shape).toBe('circle'); // becomes neutral when deselected
    });
  });
});
