import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MONTH_NAMES } from '@picsa/data';
import { generateID } from '@picsa/shared/services/core/db/db.service';

import { CalendarDataEntry } from '../../schema';
import { SeasonCalenderService } from './../../services/calender.data.service';

@Component({
  selector: 'seasonal-calendar-create-calender',
  templateUrl: './create-calendar.component.html',
  styleUrls: ['./create-calendar.component.scss'],
})
export class CreateCalendarComponent implements OnInit {
  public months = MONTH_NAMES;

  public form = this.fb.nonNullable.group({
    crops: new FormControl<any[]>([], { nonNullable: true, validators: Validators.required }),
    ID: [generateID(), Validators.required],
    name: ['', Validators.required],
    timeAndConditions: this.generateTimeAndConditionsControl([]),
  });

  public get formValue() {
    // Use rawValue to ensure data from all formControls used.
    // Reassign to force ts to check this matches db calendar entry type definition ()
    const entry: CalendarDataEntry = this.form.getRawValue();
    return entry;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: SeasonCalenderService,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    await this.service.ready();
  }

  /**
   * Generate a child form to store array of time period entries
   * See info about working with formArrays at:
   * https://blog.angular-university.io/angular-form-array/
   * */
  private generateTimeAndConditionsControl(months: string[] = []) {
    const formArray = this.fb.array<FormGroup<{ month: FormControl<string>; weather: FormControl<string> }>>(
      [],
      Validators.required
    );

    for (const month of months) {
      const group = this.fb.nonNullable.group({ month, weather: ['', Validators.required] });
      formArray.push(group);
    }
    return formArray;
  }

  public setTimePeriod(startInput: string, totalInput: string) {
    if (startInput && totalInput) {
      const start = parseInt(startInput);
      const total = parseInt(totalInput);
      // create an array using 2 cycles of months to allow for time period spanning across years,
      // e.g. 4 months starting November will slice => ["november", "december", "january", "february"]
      const months = [...this.months, ...this.months].map((m) => m.id).slice(start, start + total);
      this.form.setControl('timeAndConditions', this.generateTimeAndConditionsControl(months));
    }
  }

  async onSubmition() {
    // show error by indicating all form components interacted with
    this.form.markAllAsTouched();
    if (this.form.valid) {
      await this.service.addORUpdateData(this.formValue, 'add');
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
