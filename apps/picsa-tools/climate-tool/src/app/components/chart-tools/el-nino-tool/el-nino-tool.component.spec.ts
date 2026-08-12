import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ElNinoToolComponent } from './el-nino-tool.component';

describe('ElNinoToolComponent', () => {
  let component: ElNinoToolComponent;
  let fixture: ComponentFixture<ElNinoToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElNinoToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(ElNinoToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
