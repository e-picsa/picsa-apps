import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// eslint-disable-next-line @nx/enforce-module-boundaries
//import type { Database } from '@picsa/server-types';
import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { MonitoringFormsDashboardService } from '../../monitoring.service';

//type ITranslationEntry = Database['public']['Tables']['translations']['Row'];

@Component({
  selector: 'dashboard-translations-new',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new-monitoring-forms.component.html',
  styleUrls: ['./new-monitoring-forms.component.scss'],
})
export class NewMonitoringFormsComponent {
  en: string;
  mw_ny: string;
  ke_sw: string;
  tj_tg: string;
  zm_ny: string;
  editActionFeedbackMessage: string;
  constructor(private service: MonitoringFormsDashboardService) {
    this.service.ready();
  }
}
