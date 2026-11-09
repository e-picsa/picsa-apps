import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FALLBACK_IMAGE_CONFIGS, FallbackImageType, IFallbackImageConfig } from './fallback-image.types';

@Component({
  selector: 'picsa-fallback-image',
  imports: [MatIconModule],
  templateUrl: './fallback-image.component.html',
  styleUrl: './fallback-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaFallbackImageComponent {
  /** Target image URL (or null/undefined) */
  readonly src = input<string | null | undefined>(null);

  /** Standard fallback preset */
  readonly fallbackType = input<FallbackImageType>('document');

  /** Optional custom override for the text label */
  readonly label = input<string | undefined>(undefined);

  /** Display size */
  readonly size = input<'sm' | 'md' | 'fill'>('md');

  /** Image object-fit */
  readonly fit = input<'cover' | 'contain'>('contain');

  /** Alt text for image */
  readonly alt = input<string>('');

  private failedSrc = signal<string | null>(null);

  readonly showImage = computed(() => {
    const currentSrc = this.src();
    return Boolean(currentSrc && this.failedSrc() !== currentSrc);
  });

  readonly config = computed<IFallbackImageConfig>(() => {
    return FALLBACK_IMAGE_CONFIGS[this.fallbackType()] ?? FALLBACK_IMAGE_CONFIGS.document;
  });

  readonly badgeText = computed(() => {
    return this.label() ?? this.config().badge;
  });

  onImageError() {
    this.failedSrc.set(this.src() || null);
  }
}
