import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private componentsService: PicsaCommonComponentsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  private getActivityById(id: string) {
    return ACTIVITY_DATA.find((activity) => activity.id === id);
  }

  @ViewChild('videoPlayer') videoPlayer: VideoPlayerComponent;

  async ngOnInit() {
    //  Ensure route config updated before init
    const { params } = this.route.snapshot;
    const activityId = params?.id;
    if (activityId) {
      const activity = this.getActivityById(activityId);
      if (activity) {
        this.activity = activity;
        this.componentsService.setHeader({ title: activity.label });
      }
    }
  }

  public handleTabChange(e: MatTabChangeEvent) {
    if (this.videoPlayer) {
      this.videoPlayer.pauseVideo();
    }
    if (e.index === 2) {
      this.loadToolTab();
    }
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private loadToolTab() {
    const toolUrl = this.activity.tool?.url;
    if (toolUrl) {
      // Skip loading tool if already part of url (e.g. navigate between tabs after tool loaded)
      if (location.pathname.includes(`${this.activity.id}/${toolUrl}`)) {
        return;
      }
      this.router.navigate([this.activity.tool?.url], {
        relativeTo: this.route,
        replaceUrl: true,
      });
    }
  }
}
