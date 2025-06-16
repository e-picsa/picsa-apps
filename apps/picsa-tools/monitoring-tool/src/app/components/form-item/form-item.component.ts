import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Injector,
  input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { arrayToHashmapArray } from '@picsa/utils';
import { map } from 'rxjs';

import { ISyncStatus, STATUS_ICONS } from '../../models';
import { IMonitoringForm } from '../../schema/forms';
import { IFormSubmission } from '../../schema/submissions';
import { MonitoringToolService } from '../../services/monitoring-tool.service';
import { AccessCodeDialogComponent, AccessCodeDialogResult } from '../access-code-dialog/access-code-dialog.component';
import { MonitoringMaterialModule } from '../material.module';

@Component({
  selector: 'monitoring-form-item',
  templateUrl: './form-item.component.html',
  styleUrls: ['./form-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MonitoringMaterialModule, PicsaTranslateModule],
})
export class FormItemComponent implements OnInit {
  public form = input.required<Omit<IMonitoringForm, 'enketoDefinition'>>();

  public statusIcons = STATUS_ICONS;

  public syncCounters: Record<ISyncStatus, WritableSignal<number>> = {
    complete: signal(0),
    ready: signal(0),
    draft: signal(0),
    failed: signal(0),
  };

  public syncStatusList: ISyncStatus[] = ['complete', 'draft', 'failed', 'ready'];

  // Placeholder signal will be replaced during init
  private submissions = signal<IFormSubmission[]>([]);

  constructor(
    private service: MonitoringToolService,
    private dialog: MatDialog,
    private router: Router,
    private injector: Injector,
    private route: ActivatedRoute,
  ) {
    effect(() => {
      this.updateSyncCounters(this.submissions());
    });
  }

  public isUnlocked = computed(() => {
    const { access_code, access_unlocked } = this.form();
    // Form is locked only if has access code and has not been unlocked
    if (access_code) {
      return access_unlocked === true;
    }
    return true;
  });

  ngOnInit() {
    // create query on init to ensure form input available
    this.subscribeToFormSubmissions();
  }

  // Handle form click when locked
  public async handleFormClick() {
    if (this.isUnlocked()) {
      this.goToForm(this.form()._id);
    } else {
      return this.promptFormUnlock();
    }
  }

  private subscribeToFormSubmissions() {
    const { _id } = this.form();
    const query = this.service.getFormSubmissionsQuery(_id).$.pipe(map((docs) => docs.map((d) => d.toMutableJSON())));
    this.submissions = toSignal(query, { initialValue: [], injector: this.injector }) as WritableSignal<
      IFormSubmission[]
    >;
  }

  private promptFormUnlock() {
    const dialogRef = this.dialog.open(AccessCodeDialogComponent, {
      width: '350px',
      data: this.form(),
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(async (result: AccessCodeDialogResult) => {
      if (result?.success) {
        try {
          // Update the form to be unlocked
          await this.service.unlockForm(this.form()._id);
          this.goToForm(this.form()._id);
        } catch (error) {
          await this.service.showMessage('FORM_UNLOCK_ERROR');
          console.error('Error unlocking form:', error);
        }
      }
    });
  }

  private goToForm(id: string) {
    this.router.navigate(['view', id], { relativeTo: this.route });
  }

  /** Subscribe to form submissions and summarise by status */
  private updateSyncCounters(submissions: IFormSubmission[]): void {
    const submissionsByStatus = arrayToHashmapArray<IFormSubmission>(submissions, '_sync_push_status');
    for (const status of this.syncStatusList) {
      this.syncCounters[status].set(submissionsByStatus[status]?.length || 0);
    }
  }
}
