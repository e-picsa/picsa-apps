import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { PICSA_FARMER_VIDEOS_DATA } from '@picsa/data/resources';
import { PicsaTranslateModule } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';

import { FarmerStepVideoComponent } from './step-video.component';

describe('FarmerStepVideoComponent', () => {
  let component: FarmerStepVideoComponent;
  let fixture: ComponentFixture<FarmerStepVideoComponent>;
  const mockResourcesToolService = {
    shareResource: jest.fn().mockResolvedValue(true),
    shareResources: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerStepVideoComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: FileOpener, useValue: {} },
        { provide: ResourcesToolService, useValue: mockResourcesToolService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerStepVideoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('videos', [PICSA_FARMER_VIDEOS_DATA[0]]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render stepTitle and share button when stepTitle is provided', () => {
    fixture.componentRef.setInput('stepTitle', '1. Introduction');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.step-title');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent).toContain('1. Introduction');

    const shareButton = titleEl.querySelector('button.share-btn');
    expect(shareButton).toBeTruthy();
  });

  it('should call shareVideo on single player when shareActiveVideo is clicked', async () => {
    fixture.componentRef.setInput('stepTitle', '1. Introduction');
    fixture.detectChanges();

    const singlePlayer = component.singlePlayer();
    expect(singlePlayer).toBeTruthy();
    if (singlePlayer) {
      const shareSpy = jest.spyOn(singlePlayer, 'shareVideo').mockResolvedValue(undefined);
      const titleEl = fixture.nativeElement.querySelector('.step-title');
      const shareButton = titleEl.querySelector('button.share-btn');
      shareButton.click();
      expect(shareSpy).toHaveBeenCalled();
    }
  });
});
