import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';

import { DashboardMaterialModule } from '../../../../material.module';
import { TranslationDashboardService } from '../../monitoring.service';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];
@Component({
  selector: 'dashboard-translations-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule],
  templateUrl: './monitoring.page.html',
  styleUrls: ['./monitoring.page.scss'],
})
export class MonitoringPageComponent implements OnInit {
  displayedColumns: string[] = ['tool', 'context', 'en', 'mw_ny', 'zm_ny', 'ke_sw', 'tj_tg', 'created_at'];

  constructor(public service: TranslationDashboardService, private router: Router) {}
  ngOnInit(): void {
    this.service.ready();
    this.refreshTranslations();
  }

  goToRecord(row: ITranslationRow) {
    this.router.navigate([`/translations`, row.id]);
  }

  refreshTranslations() {
    this.service.listTranslations().catch((error) => {
      console.error('Error fetching translations:', error);
    });
  }
}
