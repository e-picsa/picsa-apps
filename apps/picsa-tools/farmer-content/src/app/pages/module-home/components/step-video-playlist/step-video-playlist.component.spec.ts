import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepVideoPlaylistComponent } from './step-video-playlist.component';

describe('StepVideoPlaylistComponent', () => {
  let component: StepVideoPlaylistComponent;
  let fixture: ComponentFixture<StepVideoPlaylistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepVideoPlaylistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepVideoPlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
