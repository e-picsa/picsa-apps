import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { ILocaleCode } from '@picsa/data';

import { DashboardMaterialModule } from '../../../../material.module';
import { ITranslationRow, TranslationDashboardService } from '../../translations.service';

@Component({
  selector: 'dashboard-translations-edit',
  imports: [DashboardMaterialModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './translations-edit.component.html',
  styleUrls: ['./translations-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsEditComponent {
  public text: string;

  public form = this.fb.group({ value: [''] });

  constructor(
    private service: TranslationDashboardService,
    @Inject(MAT_DIALOG_DATA) public data: { row: ITranslationRow; locale: ILocaleCode },
    private fb: FormBuilder
  ) {
    // populate source text
    this.text = data.row.text;
    // populate saved translation value
    const value = data.row[data.locale];
    if (value) {
      this.form.patchValue({ value });
    }
  }

  async save() {
    await this.service.ready();
    const { id } = this.data.row;
    const { value } = this.form.value;
    await this.service.updateTranslationById(id, { [this.data.locale]: value });
  }
}
