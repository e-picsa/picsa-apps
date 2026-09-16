import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PicsaTranslateModule } from '@picsa/i18n';

interface BadgeConfig {
  label: string;
  classes: string;
}

const STATUS_BADGES: Record<string, BadgeConfig> = {
  open: { label: 'Open', classes: 'bg-blue-100 text-blue-800' },
  in_review: { label: 'In review', classes: 'bg-orange-100 text-orange-800' },
  resolved: { label: 'Resolved', classes: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-600' },
};

const TYPE_BADGES: Record<string, BadgeConfig> = {
  feedback: { label: 'Feedback', classes: 'bg-blue-100 text-blue-800' },
  bug_report: { label: 'Bug report', classes: 'bg-red-100 text-red-800' },
};

@Component({
  selector: 'dashboard-feedback-badge',
  imports: [PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let cfg = badgeConfig();
    @if (cfg) {
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="cfg.classes">
        {{ cfg.label | translate }}
      </span>
    }
  `,
})
export class FeedbackBadgeComponent {
  public kind = input.required<'status' | 'type'>();
  public value = input.required<string>();

  public badgeConfig = () => {
    const map = this.kind() === 'status' ? STATUS_BADGES : TYPE_BADGES;
    return map[this.value()] ?? null;
  };
}
