import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { ConfigurationService } from '@picsa/configuration/src';
import { FARMER_CONTENT_DATA, ILocaleDataEntry } from '@picsa/data';
import { LOCALES_DATA_HASHMAP } from '@picsa/data/deployments';
import { IPicsaVideo } from '@picsa/data/resources';
import { PicsaTranslateModule } from '@picsa/i18n';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { switchMap } from 'rxjs';

import { FarmerShareFlowService } from '../share-flow/share-flow.service';

interface IShareVideoLanguageOption {
  resourceId: string;
  previewUrl: string;
  locale: ILocaleDataEntry;
}

interface IShareVideoItem {
  id: string;
  title: string;
  moduleTitle: string;
  languages: IShareVideoLanguageOption[];
}

@Component({
  selector: 'farmer-content-share-videos',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, PicsaTranslateModule],
  templateUrl: './share-videos.component.html',
  styleUrl: './share-videos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareVideosComponent implements OnDestroy {
  private router = inject(Router);
  private resourcesService = inject(ResourcesToolService);
  private shareFlow = inject(FarmerShareFlowService);
  private configurationService = inject(ConfigurationService);

  public readonly shareStatus = this.shareFlow.shareStatus;
  public readonly shareStatusLabel = this.shareFlow.shareStatusLabel;
  public readonly selectedVideoIds = signal<string[]>([]);
  public readonly selectedResourceByVideoId = signal<Record<string, string>>({});

  constructor() {
    this.shareFlow.enterShareFlow();

    effect(() => {
      const items = this.videoItems();
      const { language_code } = this.configurationService.userSettings();
      const selections = { ...this.selectedResourceByVideoId() };
      let changed = false;

      for (const item of items) {
        if (selections[item.id]) continue;
        const preferred =
          item.languages.find((language) => language.locale.id === language_code) ??
          item.languages.find((language) => language.locale.language_code === language_code.split('_')[1]) ??
          item.languages[0];
        selections[item.id] = preferred.resourceId;
        changed = true;
      }

      if (changed) {
        this.selectedResourceByVideoId.set(selections);
      }
    });
  }

  ngOnDestroy() {
    this.shareFlow.exitShareFlow();
  }

  private dbFiles$ = this.resourcesService.ready$.pipe(switchMap(() => this.resourcesService.dbFiles.find().$));
  private allResourceFileDocs = toSignal(this.dbFiles$, { initialValue: [] });
  private downloadedVideoDocsById = computed(() => {
    const entries = this.allResourceFileDocs()
      .filter((doc) => doc._data.mimetype?.startsWith('video/') && Object.keys(doc._data._attachments || {}).length > 0)
      .map((doc) => [doc.id, doc] as const);
    return new Map(entries);
  });

  public readonly videoItems = computed<IShareVideoItem[]>(() => {
    const countryCode = this.configurationService.userSettings().country_code;
    const videos = FARMER_CONTENT_DATA.flatMap((module) =>
      module.steps.flatMap((step) => {
        if (step.type === 'video') {
          const item = this.buildShareVideoItem(
            step.video.id,
            step.title,
            module.title,
            step.video.children,
            countryCode,
          );
          return item ? [item] : [];
        }
        if (step.type === 'videoPlaylist') {
          return step.videos
            .map((video) =>
              this.buildShareVideoItem(video.id, video.title || step.title, module.title, video.children, countryCode),
            )
            .filter((video): video is IShareVideoItem => !!video);
        }
        return [];
      }),
    );

    const uniqueByVideoId = new Map<string, IShareVideoItem>();
    for (const video of videos) {
      if (!uniqueByVideoId.has(video.id)) {
        uniqueByVideoId.set(video.id, video);
      }
    }
    return [...uniqueByVideoId.values()];
  });

  public goBack() {
    const returnTo = history.state?.['shareVideosReturnTo'];
    if (returnTo === 'bluetooth') {
      this.router.navigate(['farmer', 'share', 'bluetooth']);
      return;
    }
    this.router.navigate(['farmer', 'share']);
  }

  public activeResourceId(video: IShareVideoItem) {
    return this.selectedResourceByVideoId()[video.id] ?? video.languages[0]?.resourceId;
  }

  public activePreviewUrl(video: IShareVideoItem) {
    const resourceId = this.activeResourceId(video);
    return video.languages.find((language) => language.resourceId === resourceId)?.previewUrl ?? '';
  }

  public activeLanguage(video: IShareVideoItem) {
    const resourceId = this.activeResourceId(video);
    return video.languages.find((language) => language.resourceId === resourceId)?.locale;
  }

  public isSelected(videoId: string) {
    return this.selectedVideoIds().includes(videoId);
  }

  public toggleSelection(videoId: string) {
    const current = this.selectedVideoIds();
    if (current.includes(videoId)) {
      this.selectedVideoIds.set(current.filter((id) => id !== videoId));
    } else {
      this.selectedVideoIds.set([...current, videoId]);
    }
  }

  public setVideoLanguage(videoId: string, resourceId: string, event: Event) {
    event.stopPropagation();
    this.selectedResourceByVideoId.update((selections) => ({ ...selections, [videoId]: resourceId }));
  }

  public async shareVideo(event: Event, video: IShareVideoItem) {
    event.stopPropagation();
    await this.shareResourceIds([this.activeResourceId(video)]);
  }

  public async shareSelectedVideos() {
    const resourceIds = this.selectedVideoIds()
      .map((videoId) => this.selectedResourceByVideoId()[videoId])
      .filter((resourceId): resourceId is string => !!resourceId);
    await this.shareResourceIds(resourceIds);
  }

  private buildShareVideoItem(
    videoId: string,
    title: string,
    moduleTitle: string,
    children: IPicsaVideo[],
    countryCode: string,
  ): IShareVideoItem | null {
    const languages = children
      .filter((child) => this.downloadedVideoDocsById().has(child.id))
      .map((child) => {
        const locale = LOCALES_DATA_HASHMAP[child.locale_codes[0]];
        if (!locale) return null;
        if (locale.country_code !== countryCode && locale.country_code !== 'global') return null;
        return {
          resourceId: child.id,
          previewUrl: child.supabase_url,
          locale,
        };
      })
      .filter((option): option is IShareVideoLanguageOption => !!option);

    if (languages.length === 0) return null;

    return { id: videoId, title, moduleTitle, languages };
  }

  private async shareResourceIds(resourceIds: string[]) {
    if (resourceIds.length === 0) {
      this.shareFlow.setShareError('Select at least one video');
      return;
    }

    await this.shareFlow.runShareAction(async () => {
      for (const resourceId of resourceIds) {
        const doc = this.downloadedVideoDocsById().get(resourceId);
        if (doc) {
          await this.resourcesService.shareFile(doc);
        }
      }
    });
  }
}
