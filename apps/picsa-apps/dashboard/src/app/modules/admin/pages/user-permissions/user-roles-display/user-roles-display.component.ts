import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import type { AppRole } from '@picsa/server-types';

@Component({
  selector: 'dashboard-user-roles-display',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './user-roles-display.component.html',
  styleUrl: './user-roles-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRolesDisplayComponent {
  roles = input.required<AppRole[]>();

  isAdmin = computed(() => {
    return this.roles()?.includes('admin') || this.roles()?.includes('deployments.admin');
  });

  roleGroups = computed(() => {
    const roles = this.roles() || [];
    if (this.isAdmin()) return [];

    const groups: { name: string; label: string; color: string }[] = [];

    // Process feature roles
    const featureRoles = roles.filter((r) => r.includes('.'));

    // We want to group by feature if possible, or just list them nicely
    // If a user is admin of a feature, we might show "Resources: Admin"
    // If they are viewer, "Resources: Viewer"

    // Let's iterate through known features to be specific or generic
    const ProcessedFeatures = new Set<string>();

    featureRoles.forEach((role) => {
      const [feature] = role.split('.');
      if (ProcessedFeatures.has(feature)) return;

      // Find the highest level for this feature
      const featureSpecificRoles = featureRoles.filter((r) => r.startsWith(feature + '.'));

      let highestLevel = 'viewer';
      if (featureSpecificRoles.includes(`${feature}.admin` as AppRole)) highestLevel = 'admin';

      const label = `${this.capitalize(feature)}: ${this.capitalize(highestLevel)}`;
      let color = 'primary';
      if (highestLevel === 'admin') color = 'accent';
      if (highestLevel === 'viewer') color = ''; // default gray

      groups.push({ name: role, label, color });
      ProcessedFeatures.add(feature);
    });

    return groups;
  });

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
