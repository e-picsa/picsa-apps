import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ResourcesAdminComponent } from './resources-admin.component';

describe('ResourcesAdminComponent', () => {
  let component: ResourcesAdminComponent;
  let fixture: ComponentFixture<ResourcesAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesAdminComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcesAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the resources admin component', () => {
    expect(component).toBeTruthy();
  });

  it('should load all 8 farmer videos in the matrix', () => {
    expect(component.farmerVideos.length).toBe(8);
    const rows = component.matrixRows();
    expect(rows.length).toBe(8);
    expect(rows[0].id).toBe('ram');
    expect(rows[0].stepNumber).toBe(1);
    expect(rows[0].title).toBe('Resource Allocation Map');
  });

  it('should compute overall statistics accurately', () => {
    const stats = component.stats();
    expect(stats.totalVideos).toBe(8);
    expect(stats.totalFiles).toBeGreaterThan(70);
    expect(stats.localeCount).toBe(12);
    expect(stats.languageCount).toBe(10);
    expect(stats.coveragePercent).toBeGreaterThan(0);
  });

  it('should filter matrix rows when searchTerm is updated', () => {
    component.searchTerm.set('seasonal');
    const filtered = component.matrixRows();
    expect(filtered.length).toBe(2); // Seasonal Calendar & Seasonal Forecast
    expect(filtered.map((r) => r.id)).toContain('seasonal_calendar');
    expect(filtered.map((r) => r.id)).toContain('seasonal_forecast');
  });

  it('should filter columns by country when selectedCountry changes', () => {
    component.selectedCountry.set('mw');
    const mwLocales = component.filteredLocales();
    expect(mwLocales.every((l) => l.country_code === 'mw')).toBe(true);
    expect(mwLocales.map((l) => l.id)).toEqual(expect.arrayContaining(['mw_ny', 'mw_tum']));
  });

  it('should open the preview dialog when openPreview is called', () => {
    const row = component.matrixRows()[0];
    const child = row.children[0];
    const locale = component.allLocales[0];

    const spy = jest
      .spyOn((component as unknown as { dialog: { open: () => unknown } }).dialog, 'open')
      .mockReturnValue({} as unknown as ReturnType<(typeof component)['openPreview']>);

    component.openPreview(row, child, locale);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
