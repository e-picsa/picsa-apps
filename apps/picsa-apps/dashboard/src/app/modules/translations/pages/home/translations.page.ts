import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Database } from '@picsa/server-types';

import { DashboardMaterialModule } from '../../../../material.module';
import { TranslationDashboardService } from '../../translations.service';

export type ITranslationRow = Database['public']['Tables']['translations']['Row'];
@Component({
  selector: 'dashboard-translations-page',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, RouterModule],
  templateUrl: './translations.page.html',
  styleUrls: ['./translations.page.scss'],
})
export class TranslationsPageComponent implements OnInit {
  displayedColumns: string[] = [ 'en', 'mw_ny', 'sw', 'tg', 'zm_ny','created_at',];
  constructor(public service: TranslationDashboardService, private router: Router) {}
  ngOnInit(): void {
    this.service.ready();
  }
  goToRecord(row:ITranslationRow){
    this.router.navigate([`/translations`, row.id]);
  }
}
