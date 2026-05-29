import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/i18n';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { switchMap } from 'rxjs';

interface IShareVideoItem {
  resourceId: string;
  title: string;
  previewUrl: string;
}

@Component({
  selector: 'farmer-content-share-videos',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, PicsaTranslateModule],
  templateUrl: './share-videos.component.html',
  styleUrl: './share-videos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerContentShareVideosComponent implements OnDestroy {
  private router = inject(Router);
  private resourcesService = inject(ResourcesToolService);
  private componentsService = inject(PicsaCommonComponentsService);

  public readonly shareStatus = signal<'idle' | 'success' | 'error'>('idle');
  public readonly shareStatusLabel = signal('');
  public readonly canShare = computed(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  public readonly selectedIds = signal<string[]>([]);

  constructor() {
    this.componentsService.patchHeader({ hideHeader: true, hideBackButton: true });
  }

  ngOnDestroy() {
    this.componentsService.patchHeader({ hideHeader: false, hideBackButton: false });
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
    const videos = FARMER_CONTENT_DATA.flatMap((module) =>
      module.steps.flatMap((step) => {
        if (step.type === 'video') {
          const downloadedChild = step.video.children.find((child) => this.downloadedVideoDocsById().has(child.id));
          if (!downloadedChild) return [];
          return [{ resourceId: downloadedChild.id, title: step.title, previewUrl: downloadedChild.supabase_url }];
        }
        if (step.type === 'videoPlaylist') {
          return step.videos
            .map((video) => {
              const downloadedChild = video.children.find((child) => this.downloadedVideoDocsById().has(child.id));
              if (!downloadedChild) return null;
              return {
                resourceId: downloadedChild.id,
                title: video.title || step.title,
                previewUrl: downloadedChild.supabase_url,
              };
            })
            .filter((video): video is IShareVideoItem => !!video);
        }
        return [];
      }),
    );

    const uniqueById = new Map<string, IShareVideoItem>();
    for (const video of videos) {
      if (!uniqueById.has(video.resourceId)) {
        uniqueById.set(video.resourceId, video);
      }
    }
    return [...uniqueById.values()];
  });

  public goBack() {
    this.router.navigate(['farmer', 'share', 'bluetooth']);
  }

  public isSelected(resourceId: string) {
    return this.selectedIds().includes(resourceId);
  }

  public toggleSelection(resourceId: string) {
    const current = this.selectedIds();
    if (current.includes(resourceId)) {
      this.selectedIds.set(current.filter((v) => v !== resourceId));
    } else {
      this.selectedIds.set([...current, resourceId]);
    }
  }

  public async shareSelectedVideos() {
    if (!this.canShare()) {
      this.shareStatus.set('error');
      this.shareStatusLabel.set('Sharing is not available on this device');
      return;
    }

    const selectedVideos = this.videoItems().filter((video) => this.selectedIds().includes(video.resourceId));
    if (selectedVideos.length === 0) {
      this.shareStatus.set('error');
      this.shareStatusLabel.set('Select at least one video');
      return;
    }

    try {
      for (const video of selectedVideos) {
        const doc = this.downloadedVideoDocsById().get(video.resourceId);
        if (doc) {
          await this.resourcesService.shareFile(doc);
        }
      }
      this.shareStatus.set('success');
      this.shareStatusLabel.set('Shared successfully');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      this.shareStatus.set('error');
      this.shareStatusLabel.set('Unable to share');
    }
  }
}
