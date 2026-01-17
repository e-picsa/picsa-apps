import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  private service = inject(TranslationDashboardService);
  data = inject<{
    row: ITranslationRow;
    locale: ILocaleCode;
  }>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  public text: string;

  public form = this.fb.group({ value: [''] });

  constructor() {
    const data = this.data;

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
