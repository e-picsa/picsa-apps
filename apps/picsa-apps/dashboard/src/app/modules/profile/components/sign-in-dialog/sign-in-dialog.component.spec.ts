import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInDialogComponent } from './sign-in-dialog.component';

describe('SignInDialogComponent', () => {
  let component: SignInDialogComponent;
  let fixture: ComponentFixture<SignInDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
