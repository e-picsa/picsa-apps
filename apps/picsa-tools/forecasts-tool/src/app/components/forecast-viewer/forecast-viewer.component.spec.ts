import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDatabaseAttachmentService } from '@picsa/shared/services/core/db_v2';

import { ForecastViewerComponent } from './forecast-viewer.component';

describe('ForecastViewerComponent', () => {
  let component: ForecastViewerComponent;
  let fixture: ComponentFixture<ForecastViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastViewerComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: FileOpener, useValue: {} },
        {
          provide: PicsaDatabaseAttachmentService,
          useValue: {
            ready: jest.fn().mockResolvedValue(true),
            getFileAttachmentURI: jest.fn().mockResolvedValue(null),
            getFileAttachmentBlob: jest.fn().mockResolvedValue(null),
            revokeFileAttachmentURIs: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForecastViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
