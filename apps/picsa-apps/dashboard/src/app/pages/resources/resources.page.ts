import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseUploadComponent } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../material.module';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, SupabaseUploadComponent],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent implements OnInit {
  async ngOnInit() {
    // TODO
    return;
  }
}
