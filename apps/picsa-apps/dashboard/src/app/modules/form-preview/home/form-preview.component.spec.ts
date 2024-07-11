import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPreviewComponent } from './form-preview.component';

describe('FormPreviewComponent', () => {
  let component: FormPreviewComponent;
  let fixture: ComponentFixture<FormPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
