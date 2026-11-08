import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { IResourceLink } from '../../../schemas';
import { ResourceItemLinkComponent } from './link';

describe('ResourceItemLinkComponent', () => {
  let component: ResourceItemLinkComponent;
  let fixture: ComponentFixture<ResourceItemLinkComponent>;
  let addSvgIconSpy: jest.SpyInstance;

  const mockResource: IResourceLink = {
    id: 'test-play-store-link',
    type: 'link',
    subtype: 'play_store',
    title: 'Test App',
    description: 'Test Description',
    url: 'io.picsa.extension',
    sort_order: 1,
  };

  beforeEach(async () => {
    addSvgIconSpy = jest.spyOn(MatIconRegistry.prototype, 'addSvgIconInNamespace');

    await TestBed.configureTestingModule({
      imports: [ResourceItemLinkComponent, PicsaTranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceItemLinkComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('resource', mockResource);
    fixture.detectChanges();
  });

  afterEach(() => {
    addSvgIconSpy.mockRestore();
  });

  it('should create and register resources_tool:play_store icon', () => {
    expect(component).toBeTruthy();
    expect(addSvgIconSpy).toHaveBeenCalledWith('resources_tool', 'play_store', expect.anything());
    expect(component.shareUrl()).toBe('https://play.google.com/store/apps/details?id=io.picsa.extension');
  });

  it('should not double-prefix when url is already a full Play Store URL', () => {
    fixture.componentRef.setInput('resource', {
      ...mockResource,
      url: 'https://play.google.com/store/apps/details?id=com.peat.GartenBank',
    });
    fixture.detectChanges();
    expect(component.shareUrl()).toBe('https://play.google.com/store/apps/details?id=com.peat.GartenBank');
  });

  it('resolves language codes to human-readable language labels', () => {
    fixture.componentRef.setInput('resource', {
      ...mockResource,
      language: 'mw_ny',
    });
    fixture.detectChanges();
    expect(component.languageLabel()).toBe('Chichewa');

    fixture.componentRef.setInput('resource', {
      ...mockResource,
      language: 'mw_en',
    });
    fixture.detectChanges();
    expect(component.languageLabel()).toBe('English');
  });

  it('determines fallback cover type and format file sizes correctly', () => {
    fixture.componentRef.setInput('resource', {
      id: 'test-file',
      type: 'file',
      subtype: 'pdf',
      title: 'Manual PDF',
      size_kb: 2400,
    });
    fixture.detectChanges();
    expect(component.fallbackInfo().badge).toBe('PDF');
    expect(component.fileSizeText()).toBe('2.3 MB');
  });
});
