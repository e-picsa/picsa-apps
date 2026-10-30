import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicsaTranslateModule } from '@picsa/i18n';
import { readFileSync } from 'fs';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { join } from 'path';

import { PdfViewerComponent } from './pdf-viewer.component';

describe('PdfViewerComponent', () => {
  let component: PdfViewerComponent;
  let fixture: ComponentFixture<PdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent, PicsaTranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should configure pdfDefaultOptions.assetsFolder and use en-US locale matching bundled assets', () => {
    expect(pdfDefaultOptions.assetsFolder).toBe('assets/pdf-viewer');
    expect(component.locale).toBe('en-US');

    // PDF.js GenericL10n uses en-US as its root locale; verify project.json bundles locale/en-US/*
    // so only a single locale file is fetched and Capacitor WebView does not 404.
    const appProjectJsonPath = join(process.cwd(), 'apps/picsa-apps/app/project.json');
    const appProjectJson = JSON.parse(readFileSync(appProjectJsonPath, 'utf8'));
    const assets: Array<string | { input?: string; glob?: string }> = appProjectJson.targets.build.options.assets;
    const pdfViewerAsset = assets.find(
      (entry): entry is { input: string; glob: string } =>
        typeof entry === 'object' && Boolean(entry.input?.includes('ngx-extended-pdf-viewer')),
    );

    expect(pdfViewerAsset).toBeDefined();
    expect(pdfViewerAsset?.glob).toContain('locale/en-US/*');
    expect(pdfViewerAsset?.glob).not.toContain('locale/en-GB/*');
  });
});
