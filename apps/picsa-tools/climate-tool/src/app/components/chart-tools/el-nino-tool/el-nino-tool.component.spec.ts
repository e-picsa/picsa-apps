import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ElNinoToolComponent, LaNinaToolComponent } from './el-nino-tool.component';

describe('EnsoToolComponents', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElNinoToolComponent, LaNinaToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();
  });

  describe('ElNinoToolComponent', () => {
    let component: ElNinoToolComponent;
    let fixture: ComponentFixture<ElNinoToolComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(ElNinoToolComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('LaNinaToolComponent', () => {
    let component: LaNinaToolComponent;
    let fixture: ComponentFixture<LaNinaToolComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(LaNinaToolComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
});
