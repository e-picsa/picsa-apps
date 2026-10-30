import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { FarmerContentModuleHomeComponent } from './module-home.component';

describe('FarmerContentModuleHomeComponent', () => {
  let component: FarmerContentModuleHomeComponent;
  let fixture: ComponentFixture<FarmerContentModuleHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerContentModuleHomeComponent, PicsaTranslateModule.forRoot()],
      providers: [provideRouter([]), provideNoopAnimations(), { provide: FileOpener, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerContentModuleHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
