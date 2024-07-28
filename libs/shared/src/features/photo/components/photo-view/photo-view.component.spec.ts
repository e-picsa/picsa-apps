import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoViewComponent } from './photo-view.component';

describe('PhotoViewComponent', () => {
  let component: PhotoViewComponent;
  let fixture: ComponentFixture<PhotoViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
