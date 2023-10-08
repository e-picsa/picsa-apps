import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivitiesEditorDialogComponent } from './activities-editor-dialog.component';

describe('ActivitiesEditorDialogComponent', () => {
  let component: ActivitiesEditorDialogComponent;
  let fixture: ComponentFixture<ActivitiesEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivitiesEditorDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
