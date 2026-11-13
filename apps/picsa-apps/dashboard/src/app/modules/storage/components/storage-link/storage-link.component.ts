import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DashboardStorageService, IDashboardStorageEntry } from '../../../storage';

/**
 * Mat icons used to represent various filetype extensions
 * https://fonts.google.com/icons
 */
const filetypeIconMapping: Record<string, string> = {
  pdf: 'description',
  jpeg: 'image',
  jpg: 'image',
  png: 'image',
  svg: 'image',
  webp: 'image',
  mp4: 'smart_display',
  mp3: 'music_note',
};

@Component({
  selector: 'dashboard-storage-link',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './storage-link.component.html',
  styleUrls: ['./storage-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.full-width]': 'fullWidth()',
  },
})
/**
 * Minimal component that takes a storage file id input and returns a link
 * to the public url of the file, as populated from resources store cache
 */
export class DashboardStorageLinkComponent {
  private service = inject(DashboardStorageService);

  /** Resource storage id */
  id = input.required<string>();

  displayStyle = input<'button' | 'link' | 'default'>('default');

  fullWidth = input<boolean>(false);

  public entry = signal<IDashboardStorageEntry | undefined>(undefined);

  public entryName = computed(() => {
    return this.entry()?.name?.split('/')?.pop() || '';
  });

  public notFound = signal(false);

  public fileTypeIcon = signal('description');

  constructor() {
    effect(() => {
      const id = this.id();
      void this.loadEntry(id);
    });
  }

  private async loadEntry(id: string) {
    if (!id) {
      this.entry.set(undefined);
      this.notFound.set(false);
      return;
    }
    this.notFound.set(false);
    try {
      const entry = await this.service.getStorageFileByPath(id);
      if (this.id() !== id) return;
      this.entry.set(entry);
      if (entry) {
        this.fileTypeIcon.set(this.getFileTypeIcon(entry));
      } else {
        this.notFound.set(true);
        console.error(`[Storage] entry not found: `, id);
      }
    } catch (err) {
      if (this.id() !== id) return;
      this.entry.set(undefined);
      this.notFound.set(true);
      console.error(`[Storage] failed to load entry: `, id, err);
    }
  }

  public handleLinkClick(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  private getFileTypeIcon(entry: IDashboardStorageEntry) {
    const extension = entry.name?.split('.').pop()?.toLowerCase();
    if (!extension) return 'description';
    return filetypeIconMapping[extension] || 'description';
  }
}
