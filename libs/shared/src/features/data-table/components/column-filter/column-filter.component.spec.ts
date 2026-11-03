import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import type { IDataTableFilterColumn } from '../../data-table.component';
import { PicsaDataTableColumnFilterComponent } from './column-filter.component';

const MOCK_CONFIG: IDataTableFilterColumn = {
  column: 'tool',
  label: 'Tool',
  options: [
    { value: 'budget', label: 'Budget' },
    { value: 'climate', label: 'Climate' },
    { value: 'seasonal-calendar', label: 'Seasonal Calendar' },
  ],
};

describe('PicsaDataTableColumnFilterComponent', () => {
  let component: PicsaDataTableColumnFilterComponent;
  let fixture: ComponentFixture<PicsaDataTableColumnFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaDataTableColumnFilterComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaDataTableColumnFilterComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', MOCK_CONFIG);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render trigger button with default state', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.header-filter-btn');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Filter by Tool');
    expect(btn.classList.contains('is-active')).toBe(false);

    const icon = btn.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('filter_list');
  });

  it('should reflect active filter state in button style and icon', () => {
    fixture.componentRef.setInput('value', 'climate');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.header-filter-btn');
    expect(btn.classList.contains('is-active')).toBe(true);

    const icon = btn.querySelector('mat-icon');
    expect(icon?.textContent?.trim()).toBe('filter_alt');
  });

  it('should filter options based on search query', () => {
    expect(component.filteredOptions()).toEqual(MOCK_CONFIG.options);

    component.setSearch('sea');
    expect(component.filteredOptions()).toEqual([{ value: 'seasonal-calendar', label: 'Seasonal Calendar' }]);

    component.setSearch('xyz');
    expect(component.filteredOptions()).toHaveLength(0);
  });

  it('should update value on selectOption', () => {
    component.selectOption('budget');
    expect(component.value()).toBe('budget');

    component.selectOption('');
    expect(component.value()).toBe('');
  });

  it('should reset search query on menu closed', () => {
    component.setSearch('test');
    expect(component.searchQuery()).toBe('test');

    component.onMenuClosed();
    expect(component.searchQuery()).toBe('');
  });
});
