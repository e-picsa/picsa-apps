import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { Database } from '@picsa/server-types';
import { PICSAFormValidators } from '@picsa/shared/modules/forms/validators';

import { DashboardMaterialModule } from '../../../../material.module';
// import { DashboardResourcesStorageLinkComponent } from '../../components/storage-link/storage-link.component';
import { TranslationDashboardService } from '../../translations.service';

type ITranslationEntry = Database['public']['Tables']['translations']['Row'];

@Component({
  selector: 'dashboard-translations-edit',
  standalone: true,
  imports: [CommonModule, DashboardMaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './translations-edit.component.html',
  styleUrls: ['./translations-edit.component.scss'],
})
export class TranslationsEditComponent {
  translationRow: ITranslationEntry;
  dataLoadError: string;
  editActionFeedbackMessage: string;
  constructor(private service: TranslationDashboardService, private route: ActivatedRoute) {
    this.service.ready();
    this.route.params.subscribe((params) => {
      const id = params['id'];
      this.service
        .getTranslationById(id)
        .then((data) => {
          this.translationRow = data;
        })
        .catch((error) => {
          console.error('Error fetching translation:', error);
          this.dataLoadError = 'Failed to fetch translation.';
        });
    });
  }

  submitForm() {
    this.service
      .updateTranslationById(this.translationRow.id, this.translationRow)
      .then((data) => {
        if (data === 'Updated successfully') {
          this.editActionFeedbackMessage = 'Updated successfully';
        }
      })
      .catch((error) => {
        console.error('Error editing translation:', error);
        this.editActionFeedbackMessage = 'Failed to edit translation.';
      });
  }
}
