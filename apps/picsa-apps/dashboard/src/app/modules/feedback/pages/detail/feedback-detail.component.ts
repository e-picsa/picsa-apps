import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
import { capitalise } from '@picsa/utils/data';

import { DashboardMaterialModule } from '../../../../material.module';
import { FeedbackBadgeComponent } from '../../components/feedback-badge.component';
import { FeedbackDashboardService, FeedbackReportRow, STATUS_OPTIONS } from '../../services/feedback-dashboard.service';

@Component({
  selector: 'dashboard-feedback-detail',
  imports: [
    DatePipe,
    FormsModule,
    DashboardMaterialModule,
    MatProgressSpinnerModule,
    PicsaTranslateModule,
    FeedbackBadgeComponent,
  ],
  templateUrl: './feedback-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(FeedbackDashboardService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(PicsaTranslateService);

  public row = signal<FeedbackReportRow | null>(null);
  public loading = signal<boolean>(true);
  public notFound = signal<boolean>(false);
  public error = signal<string | null>(null);

  public screenshotUrl = signal<string | null>(null);
  public screenshotLoading = signal<boolean>(false);
  public screenshotError = signal<boolean>(false);

  public status = signal<FeedbackReportRow['status'] | undefined>(undefined);
  public adminNotes = signal('');
  public saving = signal<boolean>(false);

  public statusOptions = STATUS_OPTIONS.filter((o) => o.value !== undefined);

  public hasChanges = computed(() => {
    const current = this.row();
    if (!current) return false;
    return this.status() !== current.status || this.adminNotes() !== (current.admin_notes || '');
  });

  public canSave = computed(() => !this.saving() && this.hasChanges());

  /** Pairs of [label, value] built from device_info keys. */
  public diagnostics = computed<Array<{ label: string; value: unknown }>>(() => {
    const deviceInfo = this.row()?.device_info || {};
    return Object.entries(deviceInfo).map(([key, value]) => ({
      label: key.split('_').map(capitalise).join(' '),
      value,
    }));
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    await this.loadRow(id);
  }

  private async loadRow(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    try {
      const found = await this.service.getById(id);
      if (!found) {
        this.notFound.set(true);
        return;
      }
      this.row.set(found);
      this.status.set(found.status);
      this.adminNotes.set(found.admin_notes || '');
      if (found.screenshot_path) {
        await this.loadScreenshot(id);
      }
    } catch {
      this.error.set(this.translate.instant('Failed to load feedback'));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadScreenshot(id: string) {
    this.screenshotLoading.set(true);
    this.screenshotError.set(false);
    try {
      const { signed_url } = await this.service.getSignedUrl(id);
      this.screenshotUrl.set(signed_url || null);
      if (!signed_url) this.screenshotError.set(true);
    } catch {
      this.screenshotError.set(true);
    } finally {
      this.screenshotLoading.set(false);
    }
  }

  public async save() {
    if (!this.canSave()) return;
    const current = this.row();
    if (!current) return;
    this.saving.set(true);
    try {
      const updated = await this.service.update(current.id, {
        status: this.status()!,
        admin_notes: this.adminNotes() || undefined,
      });
      if (!updated) {
        this.snackBar.open(this.translate.instant('Failed to save changes'), 'Dismiss', { duration: 3000 });
        return;
      }
      this.row.set(updated);
      this.status.set(updated.status);
      this.adminNotes.set(updated.admin_notes || '');
      this.snackBar.open(this.translate.instant('Changes saved'), 'Dismiss', { duration: 2500 });
    } catch {
      this.snackBar.open(this.translate.instant('Failed to save changes'), 'Dismiss', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  public goBack() {
    this.router.navigate(['/feedback']);
  }
}
