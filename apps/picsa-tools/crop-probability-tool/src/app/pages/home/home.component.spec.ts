import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PrintProvider } from '@picsa/shared/services/native/print';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let componentsService: PicsaCommonComponentsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(PicsaTranslateModule.forRoot()),
        { provide: PrintProvider, useValue: { shareHtmlDom: jest.fn() } },
      ],
    }).compileComponents();

    componentsService = TestBed.inject(PicsaCommonComponentsService);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch header with center and end portals and clear on destroy', () => {
    expect(componentsService.headerOptions().cdkPortalCenter).toBeDefined();
    expect(componentsService.headerOptions().cdkPortalEnd).toBeDefined();

    fixture.destroy();
    expect(componentsService.headerOptions().cdkPortalCenter).toBeUndefined();
    expect(componentsService.headerOptions().cdkPortalEnd).toBeUndefined();
  });

  it('should delegate shareTable to tableComponent.sharePicture when table is ready', () => {
    const mockShare = jest.fn();
    Object.defineProperty(component, 'tableComponent', {
      value: jest.fn().mockReturnValue({ sharePicture: mockShare }),
    });

    component.shareTable();
    expect(mockShare).toHaveBeenCalled();
  });
});
