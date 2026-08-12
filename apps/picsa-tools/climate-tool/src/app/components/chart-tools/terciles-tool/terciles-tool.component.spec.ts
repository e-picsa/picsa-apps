import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { TercilesToolComponent } from './terciles-tool.component';

describe('TercilesToolComponent', () => {
  let component: TercilesToolComponent;
  let fixture: ComponentFixture<TercilesToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TercilesToolComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(TercilesToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
