import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaClimateTool } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaClimateTool, PicsaTranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: SocialSharing, useValue: {} }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PicsaClimateTool);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
