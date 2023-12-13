import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IStorageEntry, ResourcesDashboardService } from '../../resources.service';

/**
 * Mat icons used to represent various filetype extensions
 * https://fonts.google.com/icons
 */
const filetypeIconMapping = {
  pdf: 'description',
  jpeg: 'image',
  jpg: 'image',
  png: 'image',
  svg: 'image',
  mp4: 'smart_display',
  mp3: 'music_note',
};

@Component({
  selector: 'dashboard-resources-storage-link',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './storage-link.component.html',
  styleUrls: ['./storage-link.component.scss'],
})
/**
 * Minimal component that takes a storage file id input and returns a link
 * to the public url of the file, as populated from resources store cache
 */
export class DashboardResourcesStorageLinkComponent implements OnInit {
  /** Resource storage id */
  @Input() id: string;

  @Input() displayStyle: 'chip' | 'link' | 'default' = 'default';

  constructor(private service: ResourcesDashboardService) {}

  public entry?: IStorageEntry;

  public notFound = false;

  public fileTypeIcon = 'description';

  async ngOnInit() {
    const entry = await this.service.getStorageFileById(this.id);
    this.entry = entry;
    this.notFound = entry ? false : true;
    if (entry) {
      this.fileTypeIcon = this.getFileTypeIcon(entry);
    }
  }

  public handleLinkClick(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  private getFileTypeIcon(entry: IStorageEntry) {
    const extension = entry.name?.split('.').pop();
    if (!extension) return 'document';
    console.log('get file type icon', entry, extension);
    return filetypeIconMapping[extension] || 'document';
  }
}
