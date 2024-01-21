import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MONTH_NAMES } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';

import { SeasonCalendarFormService } from '../../services/calendar.form.service';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit {
  public months = MONTH_NAMES;
  public monthsByID = arrayToHashmap(MONTH_NAMES, 'id');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: SeasonCalenderService,
    private formService: SeasonCalendarFormService
  ) {}

  public get form() {
    return this.formService.form;
  }
  public get formValue() {
    return this.formService.value;
  }

  async ngOnInit() {
    await this.service.ready();
    this.formService.reset();
  }

  public setTimePeriod(startInput: string, totalInput: string) {
    if (startInput !== '' && totalInput !== '') {
      const start = parseInt(startInput);
      const total = parseInt(totalInput);
      this.formService.setFormTimeAndConditions(start, total);
    } else {
      this.formService.setFormTimeAndConditions(0, 0);
    }
  }

  async handleSubmit() {
    // show error by indicating all form components interacted with
    this.form.markAllAsTouched();
    if (this.form.valid) {
      await this.service.addORUpdateData(this.formValue, 'add');
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
