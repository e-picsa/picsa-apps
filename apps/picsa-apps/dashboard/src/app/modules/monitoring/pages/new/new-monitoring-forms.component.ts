import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// eslint-disable-next-line @nx/enforce-module-boundaries
//import type { Database } from '@picsa/server-types';
import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { TranslationDashboardService } from '../../monitoring.service';

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
  constructor(private service: TranslationDashboardService) {
    this.service.ready();
  }
  submitForm() {
    const data = {
      en: this.en,
      mw_ny: this.mw_ny,
      ke_sw: this.ke_sw,
      tj_tg: this.tj_tg,
      zm_ny: this.zm_ny,
    };
    this.service
      .addTranslation(data)
      .then((data) => {
        if (data === 'Added successfully') {
          this.editActionFeedbackMessage = 'Added successfully';
        }
      })
      .catch((error) => {
        console.error('Error adding translation:', error);
        this.editActionFeedbackMessage = 'Failed to add a translation.';
      });
  }
}
