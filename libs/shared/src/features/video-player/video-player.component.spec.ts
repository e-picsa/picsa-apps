import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaVideoPlayerComponent } from './video-player.component';

describe('PicsaVideoPlayerComponent', () => {
  let component: PicsaVideoPlayerComponent;
  let fixture: ComponentFixture<PicsaVideoPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaVideoPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaVideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
