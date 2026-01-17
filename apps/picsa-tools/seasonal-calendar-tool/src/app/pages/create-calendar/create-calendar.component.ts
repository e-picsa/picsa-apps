import { Component, inject,OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CalendarEditorComponent } from '../../components/calendar-editor/calendar-editor.component';
import { SeasonCalendarService } from '../../services/calendar.data.service';
import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';

@Component({
  selector: 'seasonal-calendar-create',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
  standalone: false,
})
export class CreateCalendarComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(SeasonCalendarService);
  private formService = inject(SeasonCalendarFormService);

  @ViewChild(CalendarEditorComponent, { static: false }) editor: CalendarEditorComponent;

  public form: ISeasonCalendarForm;

  async ngOnInit() {
    await this.service.ready();
    this.form = this.formService.createForm();
  }

  async handleSubmit() {
    // call the editor validation method to update UI and show any invalid data
    const isValid = this.editor.validate();
    if (isValid) {
      const formValue = this.form.getRawValue();
      await this.service.save(formValue);
      this.router.navigate(['..', formValue.id], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
