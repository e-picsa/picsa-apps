import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '@picsa/shared/services/core/supabase';
import { UppyAngularDashboardModule } from '@uppy/angular';
import Uppy from '@uppy/core';

import { DashboardMaterialModule } from '../../material.module';

@Component({
  selector: 'dashboard-resources-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, UppyAngularDashboardModule],
  templateUrl: './resources.page.html',
  styleUrls: ['./resources.page.scss'],
})
export class ResourcesPageComponent implements OnInit {
  uppy: Uppy = new Uppy({ debug: true, autoProceed: true });

  constructor(public supabaseService: SupabaseService) {}

  async ngOnInit() {
    const table = this.supabaseService.db.table('resources');

    const { data, error } = await table.select();
    console.log({ data, error });
  }
}
