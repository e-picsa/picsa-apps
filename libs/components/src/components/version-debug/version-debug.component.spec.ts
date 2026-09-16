import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';

import { PicsaVersionDebugComponent } from './version-debug.component';
import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

describe('PicsaVersionDebugComponent', () => {
  let component: PicsaVersionDebugComponent;
  let fixture: ComponentFixture<PicsaVersionDebugComponent>;
  let dialogMock: { open: jest.Mock };
  let appUserServiceMock: { isInternalTester: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    dialogMock = { open: jest.fn() };
    appUserServiceMock = {
      isInternalTester: signal(false),
    };

    TestBed.configureTestingModule({
      imports: [PicsaVersionDebugComponent, PicsaTranslateModule.forRoot()],
      providers: [
        { provide: MatDialog, useValue: dialogMock },
        { provide: AppUserService, useValue: appUserServiceMock },
      ],
    });

    fixture = TestBed.createComponent(PicsaVersionDebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders app version text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('v');
  });

  it('opens debug dialog on click', () => {
    component.openDialog();
    expect(dialogMock.open).toHaveBeenCalledWith(
      PicsaVersionDebugDialogComponent,
      expect.objectContaining({ maxWidth: '520px' }),
    );
  });
});
