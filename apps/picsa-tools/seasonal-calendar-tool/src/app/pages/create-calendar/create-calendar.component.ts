import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CalendarEditorComponent } from '../../components/calendar-editor/calendar-editor.component';
import { ISeasonCalendarForm, SeasonCalendarFormService } from '../../services/calendar-form.service';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService
  ) {}

  @ViewChild(CalendarEditorComponent, { static: false }) editor: CalendarEditorComponent;

  public form: ISeasonCalendarForm;

  async ngOnInit() {
    await this.service.ready();
    this.form = this.formService.createForm();
  }

  async handleSubmit() {
    const isValid = this.editor.validate();
    if (isValid) {
      await this.service.save(this.form.getRawValue());
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
