import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoDebugComponent } from './photo-debug.component';

describe('PhotoDebugComponent', () => {
  let component: PhotoDebugComponent;
  let fixture: ComponentFixture<PhotoDebugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoDebugComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoDebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
