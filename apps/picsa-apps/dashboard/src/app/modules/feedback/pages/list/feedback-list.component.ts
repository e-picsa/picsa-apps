import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';
import { formatHeaderDefault, IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features/data-table';

import { DashboardMaterialModule } from '../../../../material.module';
import {
  FeedbackDashboardService,
  FeedbackFilters,
  FeedbackReportRow,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from '../../services/feedback-dashboard.service';

const DISPLAYED_COLUMNS: string[] = ['type', 'comment', 'status', 'app_version', 'os', 'has_screenshot', 'created_at'];

/** Flattened row shape for the data table (top-level keys only). */
interface FeedbackTableRow {
  id: string;
  type: string;
  comment: string;
  status: string;
  app_version: string;
  os: string;
  has_screenshot: boolean;
  created_at: string;
}

@Component({
  selector: 'dashboard-feedback-list',
  imports: [
    FormsModule,
    DashboardMaterialModule,
    MatProgressSpinnerModule,
    PicsaDataTableComponent,
    PicsaTranslateModule,
    DatePipe,
  ],
  templateUrl: './feedback-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackListComponent implements OnInit {
  private service = inject(FeedbackDashboardService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(PicsaTranslateService);

  public commentTemplate = viewChild<TemplateRef<{ $implicit: string }>>('commentTemplate');
  public statusTemplate = viewChild<TemplateRef<{ $implicit: string }>>('statusTemplate');
  public screenshotTemplate = viewChild<TemplateRef<{ $implicit: boolean }>>('screenshotTemplate');
  public createdAtTemplate = viewChild<TemplateRef<{ $implicit: string }>>('createdAtTemplate');

  public rows = signal<FeedbackTableRow[]>([]);
  public loading = signal<boolean>(true);
  public error = signal<string | null>(null);

  public statusOptions = STATUS_OPTIONS;
  public typeOptions = TYPE_OPTIONS;

  public selectedStatus: FeedbackFilters['status'] = undefined;
  public selectedType: FeedbackFilters['type'] = undefined;
  public appVersion = '';
  public os = '';

  public tableOptions: IDataTableOptions = {
    search: false,
    displayColumns: DISPLAYED_COLUMNS,
    paginatorSizes: [10, 25, 50, 100],
    formatHeader: (value) => {
      if (value === 'has_screenshot') return 'Screenshot';
      if (value === 'app_version') return 'App version';
      if (value === 'created_at') return 'Created';
      return formatHeaderDefault(value);
    },
    rowTrackBy: (_: number, row: FeedbackTableRow) => row.id,
  };

  public valueTemplates = computed<Record<string, TemplateRef<{ $implicit: unknown }>>>(() => {
    const templates: Record<string, TemplateRef<{ $implicit: unknown }>> = {};
    const comment = this.commentTemplate();
    const status = this.statusTemplate();
    const screenshot = this.screenshotTemplate();
    const createdAt = this.createdAtTemplate();
    if (comment) templates['comment'] = comment;
    if (status) templates['status'] = status;
    if (screenshot) templates['has_screenshot'] = screenshot;
    if (createdAt) templates['created_at'] = createdAt;
    return templates;
  });

  public hasFiltersActive = computed(
    () =>
      this.selectedStatus !== undefined ||
      this.selectedType !== undefined ||
      this.appVersion.trim() !== '' ||
      this.os.trim() !== '',
  );

  async ngOnInit() {
    await this.loadList();
  }

  public async loadList() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.list(this.buildFilters());
      this.rows.set(data.map((r) => this.toTableRow(r)));
    } catch {
      this.error.set(this.translate.instant('Failed to load feedback'));
      this.snackBar.open(this.translate.instant('Failed to load feedback'), 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  public applyFilters() {
    this.loadList();
  }

  public resetFilters() {
    this.selectedStatus = undefined;
    this.selectedType = undefined;
    this.appVersion = '';
    this.os = '';
    this.loadList();
  }

  public openDetail(row: FeedbackTableRow) {
    this.router.navigate(['/feedback', row.id]);
  }

  private buildFilters(): FeedbackFilters {
    const filters: FeedbackFilters = { limit: 100, offset: 0 };
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.selectedType) filters.type = this.selectedType;
    if (this.appVersion.trim()) filters.app_version = this.appVersion.trim();
    if (this.os.trim()) filters.os = this.os.trim();
    return filters;
  }

  private toTableRow(row: FeedbackReportRow): FeedbackTableRow {
    const info = row.device_info || {};
    return {
      id: row.id,
      type: row.type,
      comment: row.comment,
      status: row.status,
      app_version: String(info.app_version ?? ''),
      os: String(info.os ?? ''),
      has_screenshot: Boolean(row.screenshot_path),
      created_at: row.created_at,
    };
  }
}
