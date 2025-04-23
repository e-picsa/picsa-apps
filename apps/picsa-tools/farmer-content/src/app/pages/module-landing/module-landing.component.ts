import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IFarmerContentStep } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-module-landing',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './module-landing.component.html',
  styleUrl: './module-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerModuleLandingComponent {
  private params = toSignal(this.route.params);

  public content = computed<IFarmerContent | undefined>(() => {
    const { slug } = this.params() || {};
    return slug ? FARMER_CONTENT_DATA_BY_SLUG[slug] : undefined;
  });

  public stepGroups = computed(() => {
    const content = this.content();
    if (!content?.steps) return [];

    return content.steps.map((stepGroup, index) => {
      const firstBlock = stepGroup[0];
      return {
        index,
        title: firstBlock.type === 'text' ? firstBlock.title || '' : '', // Handle undefined title
        description: firstBlock.type === 'text' ? firstBlock.text || '' : '', // Handle undefined text
        icon: this.getStepIcon(firstBlock),
        blocks: stepGroup,
      };
    });
  });

  // Make public since used in template
  public stepIcons = {
    video: 'play_circle',
    tool: 'build',
    review: 'summarize',
    text: 'description',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService
  ) {
    this.componentService.patchHeader({
      hideHeader: false,
      hideBackButton: true,
      style: 'primary',
    });
  }

  public navigateToStep(stepIndex: number) {
    const { slug } = this.params() || {};
    if (slug) {
      // Use absolute path navigation
      this.router.navigate(['farmer', slug, stepIndex]);
      // Or if you need relative navigation:
      // this.router.navigate([stepIndex], { relativeTo: this.route });
    }
  }

  // Alternative to private method - use public property in template
  public getStepIcon(step: IFarmerContentStep): string {
    return this.stepIcons[step.type];
  }
}
