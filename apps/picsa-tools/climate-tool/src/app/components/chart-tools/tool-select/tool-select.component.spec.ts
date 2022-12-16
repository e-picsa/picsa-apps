import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolSelectComponent } from './tool-select.component';

describe('ToolSelectComponent', () => {
  let component: ToolSelectComponent;
  let fixture: ComponentFixture<ToolSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolSelectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
