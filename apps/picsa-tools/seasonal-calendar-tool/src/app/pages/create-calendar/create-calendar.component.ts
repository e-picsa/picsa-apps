import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n/src';

import { CalendarEditorComponent } from '../../components/calendar-editor/calendar-editor.component';
import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { createForm } from '../../schema/form';
import { SeasonCalendarService } from '../../services/calendar.data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'seasonal-calendar-create',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
  imports: [CalendarEditorComponent, SeasonalCalendarMaterialModule, PicsaTranslateModule],
})
export class CreateCalendarComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(SeasonCalendarService);

  @ViewChild(CalendarEditorComponent, { static: false }) editor: CalendarEditorComponent;

  private formModel = createForm();

  public form = this.formModel.form;

  async handleSubmit() {
    await this.service.ready();
    // call the editor validation method to update UI and show any invalid data
    const isValid = this.editor.validate();
    if (isValid) {
      const formValue = this.formModel.model();
      await this.service.save(formValue);
      this.router.navigate(['..', formValue.id], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
