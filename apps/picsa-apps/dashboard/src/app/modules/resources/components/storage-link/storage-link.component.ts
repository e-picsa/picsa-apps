import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { IStorageEntry, ResourcesDashboardService } from '../../resources.service';

@Component({
  selector: 'dashboard-resources-storage-link',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
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

  constructor(private service: ResourcesDashboardService) {}

  public storageEntry: IStorageEntry;

  public notFound = false;

  async ngOnInit() {
    const entry = await this.service.getStorageFileById(this.id);
    this.storageEntry = entry;
    this.notFound = entry ? false : true;
  }
}
