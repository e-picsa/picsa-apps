import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';

import { ACTIVITY_DATA, IActivityEntry } from '../../data';

@Component({
  selector: 'farmer-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit {
  activity: IActivityEntry;

  constructor(private route: ActivatedRoute, private componentsService: PicsaCommonComponentsService) {}

  @ViewChild('videoPlayer') videoPlayer: VideoPlayerComponent;

  async ngOnInit() {
    const activityId = this.route.snapshot.params.id;
    if (activityId) {
      const selectedActivity = ACTIVITY_DATA.find((activity) => activity.id === activityId);
      if (selectedActivity) {
        this.activity = selectedActivity;
      } else {
        // TODO - handle activity not found
      }
      this.componentsService.setHeader({ title: this.activity?.label });
    }
  }

  public handleTabChange() {
    if (this.videoPlayer) {
      this.videoPlayer.pauseVideo();
    }
  }
}
