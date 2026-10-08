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

  it('should render stepTitle and share button when stepTitle is provided, disabled when not downloaded', () => {
    fixture.componentRef.setInput('stepTitle', '1. Introduction');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.step-title');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent).toContain('1. Introduction');

    const shareButton = titleEl.querySelector('button.share-btn') as HTMLButtonElement;
    expect(shareButton).toBeTruthy();
    expect(shareButton.disabled).toBe(true);
  });

  it('should enable share button and call shareVideo when video is downloaded', async () => {
    fixture.componentRef.setInput('stepTitle', '1. Introduction');
    fixture.detectChanges();

    const singlePlayer = component.singlePlayer();
    expect(singlePlayer).toBeTruthy();
    if (singlePlayer) {
      singlePlayer.downloadStatus.set('complete');
      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector('.step-title');
      const shareButton = titleEl.querySelector('button.share-btn') as HTMLButtonElement;
      expect(shareButton.disabled).toBe(false);

      const shareSpy = jest.spyOn(singlePlayer, 'shareVideo').mockResolvedValue(undefined);
      shareButton.click();
      expect(shareSpy).toHaveBeenCalled();
    }
  });

  it('should handle playlist view share buttons disabled state based on download status', () => {
    fixture.componentRef.setInput('videos', [PICSA_FARMER_VIDEOS_DATA[0], PICSA_FARMER_VIDEOS_DATA[1]]);
    fixture.componentRef.setInput('stepTitle', 'Playlist');
    fixture.detectChanges();

    expect(component.viewMode()).toBe('playlist');

    const headerShareBtn = fixture.nativeElement.querySelector('.step-title button.share-btn') as HTMLButtonElement;
    expect(headerShareBtn.disabled).toBe(true);

    const itemShareBtns = fixture.nativeElement.querySelectorAll('.playlist-item button.share-item-btn');
    expect(itemShareBtns.length).toBe(2);
    expect((itemShareBtns[0] as HTMLButtonElement).disabled).toBe(true);
    expect((itemShareBtns[1] as HTMLButtonElement).disabled).toBe(true);

    const players = component.playlistPlayers();
    players[0].downloadStatus.set('complete');
    fixture.detectChanges();

    expect(headerShareBtn.disabled).toBe(false);
    expect((itemShareBtns[0] as HTMLButtonElement).disabled).toBe(false);
    expect((itemShareBtns[1] as HTMLButtonElement).disabled).toBe(true);
  });
});
