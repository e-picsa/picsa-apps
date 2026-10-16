import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DeploymentDashboardService } from '../../../deployment/deployment.service';
import { ResourcesFarmerVideosComponent } from './resources-farmer-videos.component';

describe('ResourcesFarmerVideosComponent', () => {
  let component: ResourcesFarmerVideosComponent;
  let fixture: ComponentFixture<ResourcesFarmerVideosComponent>;

  const mockActiveCountry = signal<string>('mw');
  const mockDeploymentService = {
    activeDeploymentCountry: mockActiveCountry,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesFarmerVideosComponent, NoopAnimationsModule],
      providers: [{ provide: DeploymentDashboardService, useValue: mockDeploymentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcesFarmerVideosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create and initialize with active deployment country', () => {
    expect(component).toBeTruthy();
    expect(component.activeCountry()).toBe('mw');
    expect(component.countryLabel()).toBe('Malawi');
  });

  it('should compute Malawi specific videos and locales', () => {
    const videos = component.countryVideos();
    expect(videos.length).toBe(11); // Intro + 8 steps + 2 MW testimonials
    expect(videos.some((v) => v.id === 'jackline_nkhoma')).toBe(true);
    expect(videos.some((v) => v.id === 'john_tembo')).toBe(false);

    const locales = component.countryLocales();
    expect(locales.map((l) => l.id)).toEqual(expect.arrayContaining(['global_en', 'mw_en', 'mw_ny', 'mw_tum']));
  });

  it('should compute matrix rows with correct column cells, subtitles, and exclusions', () => {
    const rows = component.matrixRows();
    expect(rows.length).toBe(11);

    const ramRow = rows.find((r) => r.id === 'ram');
    expect(ramRow).toBeTruthy();
    expect(ramRow?.cells['global_en'].status).toBe('audio');
    expect(ramRow?.cells['mw_en'].status).toBe('not_applicable');
    expect(ramRow?.cells['mw_ny'].status).toBe('audio');

    const jacklineRow = rows.find((r) => r.id === 'jackline_nkhoma');
    expect(jacklineRow).toBeTruthy();
    expect(jacklineRow?.cells['global_en'].status).toBe('not_applicable');
    expect(jacklineRow?.cells['mw_en'].status).toBe('subtitled');
    expect(jacklineRow?.cells['mw_en'].isSubtitled).toBe(true);
    expect(jacklineRow?.cells['mw_ny'].status).toBe('audio');
  });

  it('should compute column coverage statistics excluding N/A', () => {
    const coverage = component.getColumnCoverage('global_en');
    // 11 minus Step 7, Step 8, and 2 MW testimonials which have useLocalizedEn: true
    expect(coverage.applicable).toBe(7);
    expect(coverage.available).toBe(7);
    expect(coverage.percent).toBe(100);

    const mwEnCoverage = component.getColumnCoverage('mw_en');
    expect(mwEnCoverage.applicable).toBe(4);
    expect(mwEnCoverage.available).toBe(4);
  });

  it('should filter matrix rows when searchTerm is updated', () => {
    component.searchTerm.set('calendar');
    fixture.detectChanges();

    const filtered = component.matrixRows();
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('seasonal_calendar');
  });

  it('should switch dynamically when active deployment country changes', () => {
    mockActiveCountry.set('zm');
    fixture.detectChanges();

    expect(component.activeCountry()).toBe('zm');
    expect(component.countryLabel()).toBe('Zambia');
    expect(component.countryVideos().some((v) => v.id === 'john_tembo')).toBe(true);
    expect(component.countryVideos().some((v) => v.id === 'jackline_nkhoma')).toBe(false);

    const johnRow = component.matrixRows().find((r) => r.id === 'john_tembo');
    expect(johnRow?.cells['zm_en'].status).toBe('subtitled');
    expect(johnRow?.cells['zm_en'].isSubtitled).toBe(true);
  });

  it('should open video preview dialog', () => {
    const openSpy = jest
      .spyOn((component as unknown as { dialog: { open: jest.Mock } }).dialog, 'open')
      .mockReturnValue({} as never);

    const row = component.matrixRows()[0];
    const variant = row.children[0];
    const locale = component.countryLocales()[0];

    component.openPreview(row, variant, locale, false);

    expect(openSpy).toHaveBeenCalledWith(
      component.videoPreviewDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          videoTitle: row.title,
          videoId: row.id,
          resolution: variant.resolution,
        }),
      }),
    );
  });
});
