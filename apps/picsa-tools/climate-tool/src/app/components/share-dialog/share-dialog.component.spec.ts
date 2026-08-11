import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateShareDialogComponent } from './share-dialog.component';

describe('ClimateShareDialogComponent', () => {
  let component: ClimateShareDialogComponent;
  let fixture: ComponentFixture<ClimateShareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClimateShareDialogComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: SocialSharing, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateShareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
