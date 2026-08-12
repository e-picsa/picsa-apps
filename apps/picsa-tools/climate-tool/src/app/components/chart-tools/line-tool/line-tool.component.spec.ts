import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { LineToolComponent } from './line-tool.component';

describe('LineToolComponent', () => {
  let component: LineToolComponent;
  let fixture: ComponentFixture<LineToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(LineToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
