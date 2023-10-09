import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ISupabasePushEntry } from '@picsa/shared/services/core/db_v2/db-supabase-push.service';
import { hashmapToArray } from '@picsa/utils';

import { IMonitoringForm } from '../../schema/forms';

type ISyncStatus = {
  [status in ISupabasePushEntry['_supabase_push_status']]: {
    label: string;
    value: number;
    matIcon: string;
    id?: string;
  };
};

@Component({
  selector: 'monitoring-form-item',
  templateUrl: './form-item.component.html',
  styleUrls: ['./form-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormItemComponent {
  @Input() form: IMonitoringForm;

  public syncStatusMap: ISyncStatus = {
    complete: {
      label: translateMarker('Complete'),
      value: 12,
      matIcon: 'task_alt',
    },
    ready: {
      label: translateMarker('Ready'),
      value: 3,
      matIcon: 'upload_file',
    },
    draft: {
      label: translateMarker('Draft'),
      value: 1,
      matIcon: 'edit',
    },
    failed: {
      label: translateMarker('Failed'),
      value: 6,
      matIcon: 'error',
    },
  };

  public get syncStatus() {
    return hashmapToArray(this.syncStatusMap, 'id');
  }
}
