import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioPlaybackComponent } from './audio-playback.component';

describe('AudioPlaybackComponent', () => {
  let component: AudioPlaybackComponent;
  let fixture: ComponentFixture<AudioPlaybackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioPlaybackComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioPlaybackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
