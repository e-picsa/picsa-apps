import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { IFarmerVideosById, PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IResourceFile } from '@picsa/resources/src/app/schemas';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';
import { jsonNestedProperty } from '@picsa/utils';

import { ACTIVITY_DATA, IActivityEntry } from '../../data';

@Component({
  selector: 'farmer-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit {
  activity: IActivityEntry;

  public videoResource: IResourceFile;
  public videoUri: string;

  constructor(
    private componentsService: PicsaCommonComponentsService,
    private route: ActivatedRoute,
    private router: Router,
    private configurationService: ConfigurationService
  ) {}

  private getActivityById(id: string) {
    return ACTIVITY_DATA.find((activity) => activity.id === id);
  }

  @ViewChild('videoPlayer', { static: false }) videoPlayerComponent: VideoPlayerComponent;

  async ngOnInit() {
    //  Ensure route config updated before init
    const { params } = this.route.snapshot;
    const activityId = params?.id;
    if (activityId) {
      const activity = this.getActivityById(activityId);
      if (activity) {
        this.activity = activity;
        this.componentsService.setHeader({ title: activity.label });
        this.videoResource = this.getVideoResource(activity);
      }
    }
  }

  handleResourceAttachmentChange(uri: string) {
    this.videoUri = uri;
  }

  public handleTabChange(e: MatTabChangeEvent) {
    if (this.videoPlayerComponent) {
      this.videoPlayerComponent.pauseVideo();
    }
    if (e.index === 2) {
      this.loadToolTab();
    }
  }

  /**
   * Lookup db resources. Return video matching activity and language code,
   * with fallback to default video set
   */
  private getVideoResource(activity: IActivityEntry) {
    const { language } = this.configurationService.activeConfiguration.localisation;
    const localisedVideos = jsonNestedProperty<IFarmerVideosById>(
      PICSA_FARMER_VIDEO_RESOURCES,
      `${language.selected?.code}.360p`
    );
    if (localisedVideos) {
      return localisedVideos[activity.videoId];
    }
    return PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'][activity.videoId];
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
