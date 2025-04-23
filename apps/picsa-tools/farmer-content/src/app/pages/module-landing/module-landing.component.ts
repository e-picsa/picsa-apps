import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components';
import { FARMER_CONTENT_DATA_BY_SLUG, type IFarmerContent, type IFarmerContentStep } from '@picsa/data';
import { PicsaTranslateModule } from '@picsa/shared/modules';

@Component({
  selector: 'farmer-module-landing',
  standalone: true,
  imports: [CommonModule, PicsaTranslateModule, MatIconModule, MatButtonModule],
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
        title: firstBlock.type === 'text' ? firstBlock.title || '' : '',
        description: firstBlock.type === 'text' ? firstBlock.text || '' : '',
        icon: this.getStepIcon(firstBlock),
        blocks: stepGroup,
      };
    });
  });

  public stepIcons = {
    video: 'play_circle',
    tool: 'build',
    review: 'summarize',
    text: 'description',
  };

  public sectionTypes = [
    {
      title: 'Introduction Videos',
      icon: 'play_circle',
      type: 'video',
      description: 'Training videos to support PICSA',
    },
    {
      title: 'Interactive Tools',
      icon: 'build',
      type: 'tool',
      description: 'Practical tools for implementation',
    },
    {
      title: 'Review & Summary',
      icon: 'summarize',
      type: 'review',
      description: 'Materials to review what you learned',
    },
  ];

  public filterStepsByType(type: string) {
    const content = this.content();
    if (!content?.steps) return [];

    return content.steps
      .map((stepGroup, index) => {
        const firstBlock = stepGroup[0];
        return {
          index,
          title: firstBlock.type === 'text' ? firstBlock.title || '' : '',
          icon: this.getStepIcon(firstBlock),
          blocks: stepGroup,
        };
      })
      .filter((group) => group.blocks.some((block) => block.type === type));
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService
  ) {
    this.componentService.patchHeader({
      hideHeader: false,
      hideBackButton: false,
      style: 'primary',
    });
  }

  public navigateToStep(stepIndex: number) {
    const { slug } = this.params() || {};
    if (slug) {
      this.router.navigate(['farmer', slug, stepIndex]);
    }
  }

  public navigateToSection(type: string) {
    const { slug } = this.params() || {};
    if (slug) {
      // Navigate directly to the home component with a fragment that indicates the section type
      this.router.navigate(['farmer', slug, 'home'], {
        fragment: type,
        replaceUrl: true,
      });
    }
  }

  public getStepIcon(step: IFarmerContentStep): string {
    return this.stepIcons[step.type] || 'article';
  }
}
