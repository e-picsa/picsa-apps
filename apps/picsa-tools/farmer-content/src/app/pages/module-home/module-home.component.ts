import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, model, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { PicsaCommonComponentsService } from '@picsa/components/src';
import { FARMER_CONTENT_DATA_BY_SLUG, IFarmerContent, IToolData } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PhotoInputComponent, PhotoListComponent } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { TourService } from '@picsa/shared/services/core/tour';
import { map } from 'rxjs';

import { FarmerModuleFooterComponent } from './components/footer/module-footer.component';
import { FarmerStepVideoComponent } from './components/step-video/step-video.component';
import { FarmerStepVideoPlaylistComponent } from './components/step-video-playlist/step-video-playlist.component';

@Component({
  selector: 'farmer-content-module-home',
  imports: [
    CommonModule,
    FarmerModuleFooterComponent,
    FarmerStepVideoComponent,
    FarmerStepVideoPlaylistComponent,
    PicsaTranslateModule,
    MatCardModule,
    PhotoInputComponent,
    PhotoListComponent,
  ],
  templateUrl: './module-home.component.html',
  styleUrl: './module-home.component.scss',
  animations: [FadeInOut({ inSpeed: 200, inDelay: 100 })],
  // Ensure url changes update in nested tools by using default change detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FarmerContentModuleHomeComponent implements OnInit, OnDestroy {
  private slug = toSignal(this.route.params.pipe(map((v) => v.slug)));

  public content = computed<IFarmerContent | undefined>(
    () => {
      const slug = this.slug();
      if (slug) {
        return FARMER_CONTENT_DATA_BY_SLUG[slug];
      }
    },
    { equal: (a, b) => a?.id === b?.id }
  );

  /** Content to display within mat-tabs */
  public tabs = computed(() => {
    const content = this.content();
    return content?.steps || [];
  });

  /** Selected tab index. Used to programatically change tabs from custom footer */
  public selectedIndex = model(0);

  /** Track whether tool is active in mat-stepper  */
  public toolTabIndex = signal(-1);

  /** Store any user-generated photos within a folder named after module */
  public photoAlbum = computed(() => {
    const content = this.content();
    if (content) {
      return `farmer-activity/${content.id}`;
    }
    return undefined;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private componentService: PicsaCommonComponentsService,
    private tourService: TourService
  ) {
    effect(() => {
      const content = this.content();
      if (content) {
        this.componentService.patchHeader({ title: content.title });
      } else {
        // If content not loaded simply navigate back to parent.
        this.router.navigate(['../'], { relativeTo: this.route, replaceUrl: true });
      }
    });
    // load content on slug change and fix tour implementation
    // effect((onCleanup) => {
    //   // update the tour service to allow triggering tour from inside mat-tab component
    //   this.tourService.useInMatTab = true;
    //   onCleanup(() => {
    //     console.log('cleanup');
    //     this.tourService.useInMatTab = false;
    //   });
    // });
    // effect(() => {
    //   const content = this.content();
    //   if (content) {
    //     console.log('content', content);
    //     // this.componentService.patchHeader({ title: content.title });
    //   }
    // });
  }

  ngOnInit() {
    this.componentService.patchHeader({ style: 'inverted' });
  }

  ngOnDestroy() {
    this.componentService.patchHeader({ style: 'primary' });
  }

  /** When navigating to the tool tab update the url to allow the correct tool to load within a child route */
  private setToolUrl(tool: IToolData) {
    if (!location.pathname.includes(`/${tool.href}`)) {
      this.router.navigate([tool.href], { relativeTo: this.route, replaceUrl: true });
    }
  }

  private shouldHideBackButton(tool?: IToolData) {
    if (tool) {
      // HACK - budget tool doesn't show back to site select as can be done from dropdown
      if (location.pathname.includes(`/climate`)) return true;
      // default hide back button on tool home page, e.g. `/farmer/module/budget`
      // but include on nested pages, e.g. `/farmer/module/budget`
      return location.pathname.endsWith(`/${tool.href}`);
    }
    return true;
  }
}
