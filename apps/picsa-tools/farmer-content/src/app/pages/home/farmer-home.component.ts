import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FARMER_CONTENT_DATA } from '@picsa/data';
import { FadeInOut } from '@picsa/shared/animations';
import { PicsaScrollRestoreDirective } from '@picsa/shared/directives';
import { AudioPlaybackComponent } from '@picsa/shared/features/audio-playback';
import { AudioService } from '@picsa/shared/features/audio-playback';
import { PicsaTranslateModule } from '@picsa/shared/modules';

// import TestAudio from '@picsa/farmer-content/src/assets/'
@Component({
  selector: 'farmer-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    PicsaScrollRestoreDirective,
    PicsaTranslateModule,
    RouterModule,
    AudioPlaybackComponent
  ],
  providers: [AudioService],
  templateUrl: './farmer-home.component.html',
  styleUrl: './farmer-home.component.scss',
  animations: [FadeInOut()],
})
export class FarmerContentHomeComponent {
  public content = FARMER_CONTENT_DATA;
  // public testAudio = TestAudio
}
