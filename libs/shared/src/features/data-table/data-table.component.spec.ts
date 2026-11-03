import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaDataTableComponent } from './data-table.component';

const MOCK_DATA = [
  { id: '1', tool: 'budget', context: 'inputs', text: 'Seed' },
  { id: '2', tool: 'climate', context: 'chart', text: 'Rainfall' },
  { id: '3', tool: 'budget', context: 'outputs', text: 'Grain' },
  { id: '4', tool: 'seasonal-calendar', context: '', text: 'Planting' },
];

describe('PicsaDataTableComponent', () => {
  let component: PicsaDataTableComponent;
  let fixture: ComponentFixture<PicsaDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaDataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate unique sorted column filter options with formatted labels', () => {
    fixture.componentRef.setInput('data', MOCK_DATA);
    fixture.componentRef.setInput('options', {
      displayColumns: ['tool', 'context', 'text'],
      filterColumns: ['tool'],
    });
    fixture.detectChanges();

    const configs = component.columnFilterConfigs();
    expect(configs).toEqual([
      {
        column: 'tool',
        label: 'Tool',
        options: [
          { value: 'budget', label: 'Budget' },
          { value: 'climate', label: 'Climate' },
          { value: 'seasonal-calendar', label: 'Seasonal Calendar' },
        ],
      },
    ]);
  });

  it('should filter rows by selected column filter and combine with search text', () => {
    fixture.componentRef.setInput('data', MOCK_DATA);
    fixture.componentRef.setInput('options', {
      displayColumns: ['tool', 'context', 'text'],
      filterColumns: ['tool'],
    });
    fixture.detectChanges();

    expect(component.dataSource.filteredData.length).toBe(4);

    component.setColumnFilter('tool', 'budget');
    fixture.detectChanges();
    expect(component.columnFilters()).toEqual({ tool: 'budget' });
    expect(component.dataSource.filteredData.map((r) => r.id)).toEqual(['1', '3']);

    component.applyFilter('grain');
    fixture.detectChanges();
    expect(component.dataSource.filteredData.map((r) => r.id)).toEqual(['3']);

    component.setColumnFilter('tool', '');
    fixture.detectChanges();
    expect(component.columnFilters()).toEqual({});
    expect(component.dataSource.filteredData.map((r) => r.id)).toEqual(['3']);
  });

  it('should retain active filter option even when current data slice has no matching rows', () => {
    fixture.componentRef.setInput('data', MOCK_DATA);
    fixture.componentRef.setInput('options', {
      filterColumns: ['tool'],
    });
    fixture.detectChanges();

    component.setColumnFilter('tool', 'climate');
    fixture.detectChanges();

    // Update data to a subset that excludes 'climate'
    fixture.componentRef.setInput(
      'data',
      MOCK_DATA.filter((r) => r.tool === 'budget'),
    );
    fixture.detectChanges();

    expect(component.dataSource.filteredData.length).toBe(0);
    expect(component.columnFilterConfigs()[0].options.map((o) => o.value)).toEqual(['budget', 'climate']);
  });
});
