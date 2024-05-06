/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { ConfigurationService } from '@picsa/configuration/src';
import { IFarmerVideosById, PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IResourceFile } from '@picsa/resources/src/app/schemas';
import { VideoPlayerComponent } from '@picsa/shared/features/video-player/video-player.component';
import { TourService } from '@picsa/shared/services/core/tour';
import { jsonNestedProperty } from '@picsa/utils';

import { ACTIVITY_DATA, IActivityEntry } from '../../data';

@Component({
  selector: 'farmer-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit, OnDestroy {
  activity: IActivityEntry;

  public videoResource: IResourceFile;
  public videoUri: string;

  constructor(
    private componentsService: PicsaCommonComponentsService,
    private route: ActivatedRoute,
    private router: Router,
    private configurationService: ConfigurationService,
    private tourService: TourService
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
    // update the tour service to allow triggering tour from inside mat-tab component
    this.tourService.useInMatTab = true;
  }

  async ngOnDestroy() {
    // revert updates to tour service
    this.tourService.useInMatTab = false;
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
    const { language_code } = this.configurationService.userSettings();
    const { country_code } = this.configurationService.deploymentSettings();
    const localisedVideos = jsonNestedProperty<IFarmerVideosById>(
      PICSA_FARMER_VIDEO_RESOURCES,
      `${language_code}.360p`
    );
    if (localisedVideos?.[activity.videoId]) {
      return localisedVideos[activity.videoId];
    }
    // HACK - Use default fallbacks for ZM or MW
    // TODO - add english versions and make default fallback
    return country_code === 'zm'
      ? PICSA_FARMER_VIDEO_RESOURCES.zm_ny['360p'][activity.videoId]
      : PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'][activity.videoId];
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
