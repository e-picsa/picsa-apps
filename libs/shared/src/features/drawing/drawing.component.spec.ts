import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicsaDrawingComponent } from './drawing.component';

describe('DrawingComponent', () => {
  let component: PicsaDrawingComponent;
  let fixture: ComponentFixture<PicsaDrawingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicsaDrawingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PicsaDrawingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
