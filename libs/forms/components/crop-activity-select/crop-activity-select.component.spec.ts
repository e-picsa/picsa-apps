import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CropActivitySelectComponent } from './crop-activity-select.component';

describe('CropActivitySelectComponent', () => {
  let component: CropActivitySelectComponent;
  let fixture: ComponentFixture<CropActivitySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CropActivitySelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CropActivitySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
