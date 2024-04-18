import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService {
  private videoState = new BehaviorSubject({
    videoId: null,
    currentTime: 0,
    totalTime: 0,
    playbackPercentage: 0,
  });

  getVideoState() {
    return this.videoState.asObservable();
  }

  updateVideoState(state) {
    this.videoState.next(state);
  }
}
