import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import zxcvbn from 'zxcvbn';

@Component({
  selector: 'dashboard-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-1 mb-3 mt-[-10px] min-h-[36px]">
      <div class="flex gap-1">
        <!-- Bar 1 -->
        <div
          class="h-1 flex-1 rounded transition-colors"
          [class.bg-gray-200]="!password()"
          [class.bg-red-500]="password() && strength() < 2"
          [class.bg-yellow-500]="password() && strength() === 2"
          [class.bg-green-500]="password() && strength() >= 3"
        ></div>
        <!-- Bar 2 -->
        <div
          class="h-1 flex-1 rounded transition-colors"
          [class.bg-gray-200]="!password() || strength() < 2"
          [class.bg-yellow-500]="password() && strength() === 2"
          [class.bg-green-500]="password() && strength() >= 3"
        ></div>
        <!-- Bar 3 -->
        <div
          class="h-1 flex-1 rounded transition-colors"
          [class.bg-gray-200]="!password() || strength() < 3"
          [class.bg-green-500]="password() && strength() >= 3"
        ></div>
        <!-- Bar 4 -->
        <div
          class="h-1 flex-1 rounded transition-colors"
          [class.bg-gray-200]="!password() || strength() < 4"
          [class.bg-green-600]="password() && strength() >= 4"
        ></div>
      </div>
      <div class="text-xs text-gray-500 mt-[-2px] h-[16px]">
        @if (password()) {
          Strength: {{ ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength()] }}
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  password = input.required<string>();

  strength = computed(() => {
    const pwd = this.password();
    if (!pwd) return 0;
    const result = zxcvbn(pwd);
    return result.score;
  });
}
