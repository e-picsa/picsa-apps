import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
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
  private notificationService = inject(PicsaNotificationService);
  private translate = inject(PicsaTranslateService);
  private destroyRef = inject(DestroyRef);

  /** Id currently being loaded — guards against stale responses on rapid id switches. */
  private currentId?: string;

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

  public statusOptions = STATUS_OPTIONS;

  public hasChanges = computed(() => {
    const current = this.row();
    if (!current) return false;
    return this.status() !== current.status || (current.admin_notes ?? '') !== this.adminNotes();
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

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.currentId = undefined;
        this.row.set(null);
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      void this.loadRow(id);
    });
  }

  private async loadRow(id: string) {
    this.currentId = id;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.row.set(null);
    this.status.set(undefined);
    this.adminNotes.set('');
    this.screenshotUrl.set(null);
    this.screenshotLoading.set(false);
    this.screenshotError.set(false);
    try {
      const found = await this.service.getById(id);
      if (this.currentId !== id) return;
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
      if (this.currentId === id) {
        this.error.set(this.translate.instant('Failed to load feedback'));
      }
    } finally {
      if (this.currentId === id) {
        this.loading.set(false);
      }
    }
  }

  private async loadScreenshot(id: string) {
    this.screenshotLoading.set(true);
    this.screenshotError.set(false);
    try {
      const { signed_url } = await this.service.getSignedUrl(id);
      if (this.currentId !== id) return;
      this.screenshotUrl.set(signed_url || null);
      if (!signed_url) this.screenshotError.set(true);
    } catch {
      if (this.currentId === id) {
        this.screenshotError.set(true);
      }
    } finally {
      if (this.currentId === id) {
        this.screenshotLoading.set(false);
      }
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
        admin_notes: this.adminNotes(),
      });
      if (!updated) {
        this.notificationService.showErrorNotification(this.translate.instant('Failed to save changes'));
        return;
      }
      this.row.set(updated);
      this.status.set(updated.status);
      this.adminNotes.set(updated.admin_notes || '');
      this.notificationService.showSuccessNotification(this.translate.instant('Changes saved'));
    } catch {
      this.notificationService.showErrorNotification(this.translate.instant('Failed to save changes'));
    } finally {
      this.saving.set(false);
    }
  }

  public goBack() {
    this.router.navigate(['/feedback']);
  }
}
