import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UppyFileDropComponent } from './uppy-file-drop.component';

describe('UppyDropzoneComponent', () => {
  let component: UppyFileDropComponent;
  let fixture: ComponentFixture<UppyFileDropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UppyFileDropComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UppyFileDropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
