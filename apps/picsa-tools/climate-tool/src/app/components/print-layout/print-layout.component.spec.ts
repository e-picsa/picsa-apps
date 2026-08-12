import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimatePrintLayoutComponent } from './print-layout.component';

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:test';
}
if (typeof URL.revokeObjectURL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  URL.revokeObjectURL = () => {};
}

describe('PrintLayoutComponent', () => {
  let component: ClimatePrintLayoutComponent;
  let fixture: ComponentFixture<ClimatePrintLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimatePrintLayoutComponent, PicsaTranslateModule.forRoot()],
      providers: [{ provide: SocialSharing, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimatePrintLayoutComponent);
    fixture.componentRef.setInput('chartPngBlob', new Blob());
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
