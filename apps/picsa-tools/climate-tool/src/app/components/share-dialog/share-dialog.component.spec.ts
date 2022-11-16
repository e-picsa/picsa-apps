import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateShareDialogComponent } from './share-dialog.component';

describe('ClimateShareDialogComponent', () => {
  let component: ClimateShareDialogComponent;
  let fixture: ComponentFixture<ClimateShareDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClimateShareDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClimateShareDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
