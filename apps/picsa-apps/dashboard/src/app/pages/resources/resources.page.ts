import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';

import { DashboardMaterialModule } from '../../material.module';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent implements OnInit {
  constructor(public supabaseService: SupabaseService) {}
  async ngOnInit() {
    const table = this.supabaseService.db.table('resources');

    const { data, error } = await table.select();
    console.log({ data, error });
  }
}
